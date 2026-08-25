import { redeemToken } from "@/lib/connect";
import { getDb } from "@/lib/db";
import { jsonError, requireSession, requestIp } from "@/lib/http";
import { redeemSchema } from "@/lib/schemas";

export const runtime = "nodejs";

const statusFor = {
  invalid: 404,
  expired: 404,
  self: 400,
  rate_limit: 429,
  not_signed_in: 401,
} as const;

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session.ok) return session.error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError(400, "invalid json");
  }
  const parsed = redeemSchema.safeParse(json);
  if (!parsed.success) return jsonError(400, "invalid token");

  const result = await redeemToken(getDb(), {
    viewerId: session.userId,
    token: parsed.data.token,
    ip: requestIp(request),
  });
  if (!result.ok) {
    return jsonError(statusFor[result.code], result.code);
  }
  return Response.json({ connected: result.otherUserId });
}
