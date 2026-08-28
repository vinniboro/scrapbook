import { auth, signIn } from "@/lib/auth";
import { isPhone } from "@/lib/device";
import { Button } from "@/components/ui";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  const phone = isPhone((await headers()).get("user-agent"));

  if (!session?.user?.id) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8">
        <h1 className="type-display lowercase">scrapbook</h1>
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <Button type="submit">Continue with Google</Button>
        </form>
        <a href="/worth" className="text-caption opacity-50">
          What is truly worth sharing?
        </a>
      </main>
    );
  }
  if (!session.user.onboardedAt) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8">
        <p className="type-essay">nothing to view. scan a QR.</p>
        <a href="/qr" className="text-caption opacity-50">
          your code
        </a>
      </main>
    );
  }
  if (!session.user.walkthroughCompletedAt) {
    redirect("/how");
  }
  redirect(phone ? "/me" : "/today");
}
