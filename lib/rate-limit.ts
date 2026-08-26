import { and, count, eq, gt, isNotNull, lt, or } from "drizzle-orm";
import { connectTokens, redeemAttempts } from "@/db/schema";
import type { AppDb } from "@/lib/types";

export async function tooManyAttempts(
  db: AppDb,
  bucket: string,
  at: Date,
  windowMs: number,
  maxPerBucket: number,
): Promise<boolean> {
  const since = new Date(at.getTime() - windowMs);
  const [row] = await db
    .select({ n: count() })
    .from(redeemAttempts)
    .where(
      and(eq(redeemAttempts.bucket, bucket), gt(redeemAttempts.createdAt, since)),
    );
  return (row?.n ?? 0) >= maxPerBucket;
}

export async function recordAttempt(db: AppDb, bucket: string, at: Date) {
  await db.insert(redeemAttempts).values({ bucket, createdAt: at });
}

export async function pruneAttemptsOlderThan(
  db: AppDb,
  at: Date,
  windowMs: number,
) {
  const cutoff = new Date(at.getTime() - windowMs);
  await db.delete(redeemAttempts).where(lt(redeemAttempts.createdAt, cutoff));
}

export async function enforceRateLimit(
  db: AppDb,
  buckets: string[],
  at: Date,
  windowMs: number,
  maxPerBucket: number,
): Promise<boolean> {
  for (const bucket of buckets) {
    if (await tooManyAttempts(db, bucket, at, windowMs, maxPerBucket)) {
      return false;
    }
  }
  for (const bucket of buckets) {
    await recordAttempt(db, bucket, at);
  }
  return true;
}

export async function sweepExpiredConnectTokens(db: AppDb, at: Date) {
  await db
    .delete(connectTokens)
    .where(
      or(
        lt(connectTokens.expiresAt, at),
        isNotNull(connectTokens.consumedAt),
      ),
    );
}
