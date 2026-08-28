import { requireMember } from "@/lib/http";
import { completeWalkthrough } from "@/lib/scraps";

export const runtime = "nodejs";

export async function POST() {
  const member = await requireMember();
  if (!member.ok) return member.error;
  await completeWalkthrough(member.db, member.userId);
  return Response.json({ ok: true });
}
