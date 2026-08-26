import { auth, signIn } from "@/lib/auth";
import { isPhone } from "@/lib/device";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  const phone = isPhone((await headers()).get("user-agent"));

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
          <a href="/worth">What is truly worth sharing?</a>
        </p>
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
  redirect(phone ? "/up" : "/today");
}
