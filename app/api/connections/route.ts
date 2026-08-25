import { disconnectUsers, listConnections } from "@/lib/connections";
import { jsonError, requireMember } from "@/lib/http";
import { disconnectSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET() {
  const member = await requireMember();
  if (!member.ok) return member.error;
  const people = await listConnections(member.db, member.userId);
  return Response.json({ connections: people });
}

export async function DELETE(request: Request) {
  const member = await requireMember();
  if (!member.ok) return member.error;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError(400, "invalid json");
  }
  const parsed = disconnectSchema.safeParse(json);
  if (!parsed.success) return jsonError(400, "invalid userId");
  await disconnectUsers(member.db, member.userId, parsed.data.userId);
  return Response.json({ ok: true });
}
