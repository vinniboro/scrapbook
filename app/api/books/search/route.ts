import { searchBooks } from "@/lib/books";
import { jsonError, requireMember } from "@/lib/http";
import { booksQuerySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const member = await requireMember();
  if (!member.ok) return member.error;
  const parsed = booksQuerySchema.safeParse({
    q: new URL(request.url).searchParams.get("q") ?? "",
  });
  if (!parsed.success) return jsonError(400, "query required");
  const hits = await searchBooks(parsed.data.q);
  return Response.json({ books: hits });
}
