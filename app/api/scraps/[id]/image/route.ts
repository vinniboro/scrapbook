import { getImageStore } from "@/lib/blob";
import { getDb } from "@/lib/db";
import { jsonError, requireSession } from "@/lib/http";
import { getScrapImage } from "@/lib/scraps";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  const viewerId = session.ok ? session.userId : null;
  const { id } = await context.params;
  const image = await getScrapImage(getDb(), viewerId, id, getImageStore());
  if (!image) return jsonError(404, "not found");
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.contentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
