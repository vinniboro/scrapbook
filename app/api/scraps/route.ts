import { getImageStore } from "@/lib/blob";
import { jsonError, requireMember } from "@/lib/http";
import { createScrap, serializeScrap } from "@/lib/scraps";
import { imageMetaSchema, textScrapSchema } from "@/lib/schemas";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const member = await requireMember();
  if (!member.ok) return member.error;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const parsed = imageMetaSchema.safeParse({
      type: form.get("type"),
      visibility: form.get("visibility"),
      body: form.get("body") || undefined,
    });
    if (!parsed.success) {
      return jsonError(400, "visibility is required");
    }
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError(400, "file required");
    if (!ALLOWED_TYPES.has(file.type)) return jsonError(400, "unsupported image");
    if (file.size > MAX_BYTES) return jsonError(400, "file too large");
    const bytes = Buffer.from(await file.arrayBuffer());
    const scrap = await createScrap(
      member.db,
      member.userId,
      {
        type: "image",
        visibility: parsed.data.visibility,
        body: parsed.data.body,
        bytes,
        contentType: file.type,
      },
      getImageStore(),
    );
    return Response.json(serializeScrap(scrap), { status: 201 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError(400, "invalid json");
  }
  const parsed = textScrapSchema.safeParse(json);
  if (!parsed.success) {
    const missingVisibility =
      typeof json === "object" &&
      json !== null &&
      !("visibility" in json);
    return jsonError(400, missingVisibility ? "visibility is required" : "invalid scrap");
  }
  const scrap = await createScrap(
    member.db,
    member.userId,
    parsed.data,
    getImageStore(),
  );
  return Response.json(serializeScrap(scrap), { status: 201 });
}
