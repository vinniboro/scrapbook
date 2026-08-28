import { createGroup, listGroupsForUser } from "@/lib/groups";
import { jsonError, requireMember } from "@/lib/http";
import { groupCreateSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET() {
  const member = await requireMember();
  if (!member.ok) return member.error;
  const groups = await listGroupsForUser(member.db, member.userId);
  return Response.json({ groups });
}

export async function POST(request: Request) {
  const member = await requireMember();
  if (!member.ok) return member.error;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError(400, "invalid json");
  }
  const parsed = groupCreateSchema.safeParse(json);
  if (!parsed.success) return jsonError(400, "invalid group");
  const group = await createGroup(member.db, member.userId, parsed.data.name);
  if (!group) return jsonError(400, "invalid group");
  return Response.json(group, { status: 201 });
}
