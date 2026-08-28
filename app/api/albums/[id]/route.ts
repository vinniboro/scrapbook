import { addAlbumItem, deleteAlbum, removeAlbumItem } from "@/lib/albums";
import { getAlbumForViewer } from "@/lib/albums";
import { getDb } from "@/lib/db";
import { jsonError, requireMember, requireSession } from "@/lib/http";
import { getScrapForViewer, serializeScrap } from "@/lib/scraps";
import { albumItemSchema } from "@/lib/schemas";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session.ok) return jsonError(404, "not found");
  const { id } = await context.params;
  const result = await getAlbumForViewer(getDb(), session.userId, id);
  if (!result) return jsonError(404, "not found");
  const scraps = [];
  for (const item of result.items) {
    const scrap = await getScrapForViewer(getDb(), session.userId, item.scrapId);
    if (scrap) scraps.push(serializeScrap(scrap));
  }
  return Response.json({ album: result.album, scraps });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const member = await requireMember();
  if (!member.ok) return member.error;
  const { id } = await context.params;
  const ok = await deleteAlbum(member.db, member.userId, id);
  if (!ok) return jsonError(404, "not found");
  return new Response(null, { status: 204 });
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
  const parsed = albumItemSchema.safeParse(json);
  if (!parsed.success) return jsonError(400, "invalid item");
  const result = await addAlbumItem(
    member.db,
    member.userId,
    id,
    parsed.data.scrapId,
  );
  if (!result.ok) {
    const status = result.code === "leak" ? 400 : 404;
    return jsonError(status, result.code);
  }
  return Response.json({ ok: true });
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
  const parsed = albumItemSchema.safeParse(json);
  if (!parsed.success) return jsonError(400, "invalid item");
  const ok = await removeAlbumItem(
    member.db,
    member.userId,
    id,
    parsed.data.scrapId,
  );
  if (!ok) return jsonError(404, "not found");
  return Response.json({ ok: true });
}
