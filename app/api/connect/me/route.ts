import { connectUrl, mintConnectToken } from "@/lib/connect";
import { requireMember, requestOrigin } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const member = await requireMember();
  if (!member.ok) return member.error;
  const token = await mintConnectToken(member.db, member.userId);
  const url = connectUrl(requestOrigin(request), token);
  return Response.json({ url });
}
