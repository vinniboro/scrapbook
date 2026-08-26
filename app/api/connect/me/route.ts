import { connectUrl, enforceMintRateLimit, mintConnectToken } from "@/lib/connect";
import { jsonError, requireMember, requestIp, requestOrigin } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const member = await requireMember();
  if (!member.ok) return member.error;
  const ip = requestIp(request);
  if (!(await enforceMintRateLimit(member.db, member.userId, ip))) {
    return jsonError(429, "rate_limit");
  }
  const token = await mintConnectToken(member.db, member.userId);
  const url = connectUrl(requestOrigin(request), token);
  return Response.json({ url });
}
