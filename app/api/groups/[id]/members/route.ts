import { addGroupMember, isGroupMember, listGroupMembers, removeGroupMember } from "@/lib/groups";
import { jsonError, requireMember } from "@/lib/http";
import { groupMemberSchema } from "@/lib/schemas";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const member = await requireMember();
  if (!member.ok) return member.error;
  const { id } = await context.params;
  if (!(await isGroupMember(member.db, id, member.userId))) {
    return jsonError(404, "not found");
  }
  const people = await listGroupMembers(member.db, id);
  return Response.json({ members: people });
}

export async function POST(request: Request, context: RouteContext) {
  const member = await requireMember();
  if (!member.ok) return member.error;
  const { id } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError(400, "invalid json");
  }
  const parsed = groupMemberSchema.safeParse(json);
  if (!parsed.success) return jsonError(400, "invalid member");
  const result = await addGroupMember(
    member.db,
    member.userId,
    id,
    parsed.data.userId,
  );
  if (!result.ok) {
    const status = result.code === "not_found" ? 404 : 400;
    return jsonError(status, result.code);
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, context: RouteContext) {
  const member = await requireMember();
  if (!member.ok) return member.error;
  const { id } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError(400, "invalid json");
  }
  const parsed = groupMemberSchema.safeParse(json);
  if (!parsed.success) return jsonError(400, "invalid member");
  const ok = await removeGroupMember(
    member.db,
    member.userId,
    id,
    parsed.data.userId,
  );
  if (!ok) return jsonError(404, "not found");
  return Response.json({ ok: true });
}
