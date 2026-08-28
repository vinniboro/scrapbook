import { auth, signIn } from "@/lib/auth";
import { HowStepper } from "@/components/how-stepper";
import { PageShell } from "@/components/ui";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function HowPage() {
  const session = await auth();
  if (!session?.user?.id) {
    await signIn("google", { redirectTo: "/how" });
    return null;
  }
  if (!session.user.onboardedAt) {
    redirect("/");
  }
  if (session.user.walkthroughCompletedAt) {
    redirect("/");
  }
  return (
    <PageShell width="prose">
      <HowStepper />
    </PageShell>
  );
}
