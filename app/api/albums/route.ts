import { createAlbum, listAlbumsForAuthor } from "@/lib/albums";
import { jsonError, requireMember } from "@/lib/http";
import { albumCreateSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET() {
  const member = await requireMember();
  if (!member.ok) return member.error;
  const rows = await listAlbumsForAuthor(member.db, member.userId);
  return Response.json({ albums: rows });
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
  const parsed = albumCreateSchema.safeParse(json);
  if (!parsed.success) return jsonError(400, "invalid album");
  const album = await createAlbum(member.db, member.userId, parsed.data);
  if (!album) return jsonError(400, "invalid album");
  return Response.json(album, { status: 201 });
}
