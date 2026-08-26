import { getDb } from "@/lib/db";
import { jsonError, requireSession } from "@/lib/http";
import { BadCursorError, listUserScraps } from "@/lib/scraps";
import { cursorQuerySchema } from "@/lib/schemas";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session.ok) return jsonError(404, "not found");
  const { id } = await context.params;
  const cursor = cursorQuerySchema.parse({
    cursor: new URL(request.url).searchParams.get("cursor") ?? undefined,
  }).cursor;
  try {
    const result = await listUserScraps(getDb(), session.userId, id, cursor);
    if (!result) return jsonError(404, "not found");
    return Response.json(result);
  } catch (error) {
    if (error instanceof BadCursorError) return jsonError(400, "bad cursor");
    throw error;
  }
}
