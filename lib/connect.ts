import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt, isNull } from "drizzle-orm";
import { connectTokens, redeemAttempts, users } from "@/db/schema";
import { connectUsers } from "@/lib/connections";
import type { AppDb } from "@/lib/types";

export const TOKEN_TTL_MS = 60_000;
export const REDEEM_WINDOW_MS = 60_000;
export const REDEEM_MAX_PER_BUCKET = 20;

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function mintConnectToken(
  db: AppDb,
  userId: string,
  at: Date = new Date(),
) {
  const raw = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(raw);
  await db.delete(connectTokens).where(eq(connectTokens.userId, userId));
  await db.insert(connectTokens).values({
    userId,
    tokenHash,
    expiresAt: new Date(at.getTime() + TOKEN_TTL_MS),
    createdAt: at,
  });
  return raw;
}

export type RedeemFailure =
  | "invalid"
  | "expired"
  | "self"
  | "rate_limit"
  | "not_signed_in";

export type RedeemResult =
  | { ok: true; otherUserId: string }
  | { ok: false; code: RedeemFailure };

async function tooManyAttempts(
  db: AppDb,
  bucket: string,
  at: Date,
): Promise<boolean> {
  const since = new Date(at.getTime() - REDEEM_WINDOW_MS);
  const [row] = await db
    .select({ n: count() })
    .from(redeemAttempts)
    .where(
      and(eq(redeemAttempts.bucket, bucket), gt(redeemAttempts.createdAt, since)),
    );
  return (row?.n ?? 0) >= REDEEM_MAX_PER_BUCKET;
}

export async function redeemToken(
  db: AppDb,
  input: {
    viewerId: string;
    token: string;
    ip: string;
    at?: Date;
  },
): Promise<RedeemResult> {
  const at = input.at ?? new Date();
  const buckets = [`uid:${input.viewerId}`, `ip:${input.ip}`];
  for (const bucket of buckets) {
    if (await tooManyAttempts(db, bucket, at)) {
      return { ok: false, code: "rate_limit" };
    }
    await db.insert(redeemAttempts).values({ bucket, createdAt: at });
  }

  const tokenHash = hashToken(input.token);
  const [row] = await db
    .select()
    .from(connectTokens)
    .where(
      and(eq(connectTokens.tokenHash, tokenHash), isNull(connectTokens.consumedAt)),
    )
    .limit(1);

  if (!row) return { ok: false, code: "invalid" };
  if (row.expiresAt.getTime() <= at.getTime()) {
    return { ok: false, code: "expired" };
  }
  if (row.userId === input.viewerId) {
    return { ok: false, code: "self" };
  }

  await db
    .update(connectTokens)
    .set({ consumedAt: at })
    .where(eq(connectTokens.id, row.id));

  await db
    .update(users)
    .set({ onboardedAt: at })
    .where(eq(users.id, input.viewerId));

  await connectUsers(db, input.viewerId, row.userId);
  return { ok: true, otherUserId: row.userId };
}

export function connectUrl(origin: string, rawToken: string) {
  return `${origin}/know/${rawToken}`;
}
