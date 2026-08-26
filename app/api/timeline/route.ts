import { jsonError, requireSession } from "@/lib/http";
import { getDb } from "@/lib/db";
import { BadCursorError, listTimeline } from "@/lib/scraps";
import { cursorQuerySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session.ok) return session.error;
  const cursor = cursorQuerySchema.parse({
    cursor: new URL(request.url).searchParams.get("cursor") ?? undefined,
  }).cursor;
  try {
    const result = await listTimeline(getDb(), session.userId, cursor);
    return Response.json(result);
  } catch (error) {
    if (error instanceof BadCursorError) return jsonError(400, "bad cursor");
    throw error;
  }
}
