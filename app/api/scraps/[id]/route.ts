import { jsonError, requireMember, requireSession } from "@/lib/http";
import {
  deleteScrap,
  getScrapForViewer,
  serializeScrap,
  updateScrap,
} from "@/lib/scraps";
import { scrapPatchSchema } from "@/lib/schemas";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  const viewerId = session.ok ? session.userId : null;
  const { id } = await context.params;
  const scrap = await getScrapForViewer(getDb(), viewerId, id);
  if (!scrap) return jsonError(404, "not found");
  return Response.json(serializeScrap(scrap));
}

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
  const parsed = scrapPatchSchema.safeParse(json);
  if (!parsed.success) return jsonError(400, "invalid patch");
  const scrap = await updateScrap(member.db, member.userId, id, parsed.data);
  if (!scrap) return jsonError(404, "not found");
  return Response.json(serializeScrap(scrap));
}

export async function DELETE(_request: Request, context: RouteContext) {
  const member = await requireMember();
  if (!member.ok) return member.error;
  const { id } = await context.params;
  const ok = await deleteScrap(member.db, member.userId, id);
  if (!ok) return jsonError(404, "not found");
  return new Response(null, { status: 204 });
}
