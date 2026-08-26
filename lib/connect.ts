import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { connectTokens, users } from "@/db/schema";
import { connectUsers } from "@/lib/connections";
import {
  enforceRateLimit,
  pruneAttemptsOlderThan,
  sweepExpiredConnectTokens,
} from "@/lib/rate-limit";
import type { AppDb } from "@/lib/types";

export const TOKEN_TTL_MS = 60_000;
export const REDEEM_WINDOW_MS = 60_000;
export const REDEEM_MAX_PER_BUCKET = 20;
export const MINT_WINDOW_MS = 60_000;
export const MINT_MAX_PER_BUCKET = 30;
export const SCRAP_CREATE_WINDOW_MS = 60_000;
export const SCRAP_CREATE_MAX_PER_BUCKET = 40;

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function mintConnectToken(
  db: AppDb,
  userId: string,
  at: Date = new Date(),
) {
  await sweepExpiredConnectTokens(db, at);
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

export async function enforceMintRateLimit(
  db: AppDb,
  userId: string,
  ip: string,
  at: Date = new Date(),
): Promise<boolean> {
  await pruneAttemptsOlderThan(db, at, MINT_WINDOW_MS);
  return enforceRateLimit(
    db,
    [`mint:uid:${userId}`, `mint:ip:${ip}`],
    at,
    MINT_WINDOW_MS,
    MINT_MAX_PER_BUCKET,
  );
}

export async function enforceScrapCreateRateLimit(
  db: AppDb,
  userId: string,
  ip: string,
  at: Date = new Date(),
): Promise<boolean> {
  await pruneAttemptsOlderThan(db, at, SCRAP_CREATE_WINDOW_MS);
  return enforceRateLimit(
    db,
    [`scrap:uid:${userId}`, `scrap:ip:${ip}`],
    at,
    SCRAP_CREATE_WINDOW_MS,
    SCRAP_CREATE_MAX_PER_BUCKET,
  );
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
  await pruneAttemptsOlderThan(db, at, REDEEM_WINDOW_MS);

  const buckets = [`redeem:uid:${input.viewerId}`, `redeem:ip:${input.ip}`];
  const allowed = await enforceRateLimit(
    db,
    buckets,
    at,
    REDEEM_WINDOW_MS,
    REDEEM_MAX_PER_BUCKET,
  );
  if (!allowed) return { ok: false, code: "rate_limit" };

  const tokenHash = hashToken(input.token);
  const [existing] = await db
    .select()
    .from(connectTokens)
    .where(
      and(eq(connectTokens.tokenHash, tokenHash), isNull(connectTokens.consumedAt)),
    )
    .limit(1);

  if (!existing) return { ok: false, code: "invalid" };
  if (existing.expiresAt.getTime() <= at.getTime()) {
    return { ok: false, code: "expired" };
  }
  if (existing.userId === input.viewerId) {
    return { ok: false, code: "self" };
  }

  const [consumed] = await db
    .update(connectTokens)
    .set({ consumedAt: at })
    .where(
      and(
        eq(connectTokens.tokenHash, tokenHash),
        isNull(connectTokens.consumedAt),
        gt(connectTokens.expiresAt, at),
      ),
    )
    .returning();

  if (!consumed) return { ok: false, code: "invalid" };

  await db
    .update(users)
    .set({ onboardedAt: at })
    .where(eq(users.id, input.viewerId));

  await connectUsers(db, input.viewerId, consumed.userId);
  return { ok: true, otherUserId: consumed.userId };
}

export function connectUrl(origin: string, rawToken: string) {
  return `${origin}/know/${rawToken}`;
}
