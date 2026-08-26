import { auth, signIn } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listTimeline } from "@/lib/scraps";

export const runtime = "nodejs";

export default async function TodayPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/today" });
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

  const { scraps } = await listTimeline(getDb(), session.user.id);
  if (scraps.length === 0) {
    return (
      <main>
        <p>nothing to sit with today.</p>
        <p>
          <a href="/up">What have you been up to?</a>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Today</h1>
      <ol>
        {scraps.map((scrap) => (
          <li key={scrap.id}>
            <p>{scrap.place}</p>
            {scrap.type === "text" ? (
              <p>{scrap.body}</p>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={scrap.image ?? ""} alt="" width={240} />
            )}
          </li>
        ))}
      </ol>
      <p>That is all for today.</p>
    </main>
  );
}
