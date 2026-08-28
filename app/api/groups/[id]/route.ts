import { deleteGroup, isGroupMember, renameGroup } from "@/lib/groups";
import { jsonError, requireMember } from "@/lib/http";
import { groupPatchSchema } from "@/lib/schemas";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const member = await requireMember();
  if (!member.ok) return member.error;
  const { id } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError(400, "invalid json");
  }
  const parsed = groupPatchSchema.safeParse(json);
  if (!parsed.success) return jsonError(400, "invalid patch");
  const group = await renameGroup(member.db, member.userId, id, parsed.data.name);
  if (!group) return jsonError(404, "not found");
  return Response.json(group);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const member = await requireMember();
  if (!member.ok) return member.error;
  const { id } = await context.params;
  const ok = await deleteGroup(member.db, member.userId, id);
  if (!ok) return jsonError(404, "not found");
  return new Response(null, { status: 204 });
}

export async function GET(_request: Request, context: RouteContext) {
  const member = await requireMember();
  if (!member.ok) return member.error;
  const { id } = await context.params;
  const membership = await isGroupMember(member.db, id, member.userId);
  if (!membership) return jsonError(404, "not found");
  return Response.json({ id, role: membership.role });
}
