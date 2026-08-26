import { auth, signIn } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getImageStore } from "@/lib/blob";
import { createScrap, isMember } from "@/lib/scraps";
import { toStoredVisibility } from "@/lib/visibility-names";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

async function requireMemberId() {
  const session = await auth();
  if (!session?.user?.id) {
    await signIn("google", { redirectTo: "/up" });
    return null;
  }
  const db = getDb();
  if (!(await isMember(db, session.user.id))) {
    return null;
  }
  return { userId: session.user.id, db };
}

export default async function UpPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/up" });
          }}
        >
          <button type="submit">Continue with Google</button>
        </form>
      </main>
    );
  }
  if (!session.user.onboardedAt) {
    return (
      <main>
        <p>nothing to view. scan a QR.</p>
        <p>
          <a href="/qr">your code</a>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>What have you been up to?</h1>
      <form action={captureText} method="post">
        <label>
          words
          <textarea name="body" required rows={6} />
        </label>
        <fieldset>
          <legend>where does this go</legend>
          <label>
            <input type="radio" name="visibility" value="close" defaultChecked />
            close — people you have stood with
          </label>
          <label>
            <input type="radio" name="visibility" value="room" />
            room — one room further
          </label>
        </fieldset>
        <button type="submit">place</button>
      </form>
      <form action={captureImage} method="post" encType="multipart/form-data">
        <label>
          a photograph
          <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/gif" required />
        </label>
        <fieldset>
          <legend>where does this go</legend>
          <label>
            <input type="radio" name="visibility" value="close" defaultChecked />
            close
          </label>
          <label>
            <input type="radio" name="visibility" value="room" />
            room
          </label>
        </fieldset>
        <button type="submit">place</button>
      </form>
    </main>
  );
}

async function captureText(formData: FormData) {
  "use server";
  const member = await requireMemberId();
  if (!member) redirect("/up");
  const body = String(formData.get("body") ?? "").trim();
  const stored = toStoredVisibility(String(formData.get("visibility") ?? ""));
  if (!body || !stored) redirect("/up");
  await createScrap(
    member.db,
    member.userId,
    { type: "text", visibility: stored, body },
    getImageStore(),
  );
  redirect("/today");
}

async function captureImage(formData: FormData) {
  "use server";
  const member = await requireMemberId();
  if (!member) redirect("/up");
  const stored = toStoredVisibility(String(formData.get("visibility") ?? ""));
  const file = formData.get("file");
  if (!stored || !(file instanceof File) || file.size === 0) redirect("/up");
  const bytes = Buffer.from(await file.arrayBuffer());
  await createScrap(
    member.db,
    member.userId,
    {
      type: "image",
      visibility: stored,
      bytes,
      contentType: file.type || "image/jpeg",
    },
    getImageStore(),
  );
  redirect("/today");
}
