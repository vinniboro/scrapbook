import { jsonError, requireMember } from "@/lib/http";
import { profilePatchSchema } from "@/lib/schemas";
import { updateProfile } from "@/lib/users";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const member = await requireMember();
  if (!member.ok) return member.error;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError(400, "invalid json");
  }
  const parsed = profilePatchSchema.safeParse(json);
  if (!parsed.success) return jsonError(400, "invalid profile");
  const row = await updateProfile(member.db, member.userId, parsed.data);
  if (!row) return jsonError(409, "handle taken");
  return Response.json({
    id: row.id,
    name: row.name,
    handle: row.handle,
  });
}
