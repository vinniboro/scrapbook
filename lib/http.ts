import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isMember } from "@/lib/scraps";
import type { AppDb } from "@/lib/types";
import type { Session } from "next-auth";

export function jsonError(status: number, error: string) {
  return Response.json({ error }, { status });
}

type SessionResult =
  | { ok: true; userId: string; session: Session }
  | { ok: false; error: Response };

export async function requireSession(): Promise<SessionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: jsonError(401, "unauthorized") };
  }
  return { ok: true, userId: session.user.id, session };
}

export async function requireMember(): Promise<
  { ok: true; userId: string; db: AppDb } | { ok: false; error: Response }
> {
  const session = await requireSession();
  if (!session.ok) return session;
  const db = getDb();
  if (!(await isMember(db, session.userId))) {
    return { ok: false, error: jsonError(403, "not a member") };
  }
  return { ok: true, userId: session.userId, db };
}

export function requestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function requestOrigin(request: Request) {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return new URL(request.url).origin;
}
