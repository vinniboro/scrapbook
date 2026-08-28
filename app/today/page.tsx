import { AppShell } from "@/components/app-shell";
import { PhoneRedirect } from "@/components/phone-redirect";
import { SittingStack } from "@/components/sitting-stack";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listTimeline } from "@/lib/scraps";
import Link from "next/link";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function TodayPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.onboardedAt) redirect("/");
  if (!session.user.walkthroughCompletedAt) redirect("/how");

  const { scraps } = await listTimeline(getDb(), session.user.id);
  return (
    <AppShell>
      <PhoneRedirect to="/me" />
      <div className="hidden md:block">
        {scraps.length === 0 ? (
          <div className="flex flex-col gap-4 py-12">
            <p className="type-display">nothing to sit with today.</p>
            <Link href="/up" className="text-caption opacity-70">
              What have you been up to?
            </Link>
          </div>
        ) : (
          <SittingStack scraps={scraps} />
        )}
      </div>
    </AppShell>
  );
}
