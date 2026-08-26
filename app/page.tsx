import { auth, signIn } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main>
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button type="submit">Continue with Google</button>
        </form>
        <p>
          <a href="/worth">the manifesto</a>
        </p>
      </main>
    );
  }
  if (!session.user.onboardedAt) {
    return (
      <main>
        <p>nothing to view. scan a QR.</p>
      </main>
    );
  }
  return (
    <main>
      <p>open /qr on your phone to connect. GET /api/timeline to view.</p>
    </main>
  );
}
