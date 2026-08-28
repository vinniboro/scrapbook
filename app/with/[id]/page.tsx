import { AppShell } from "@/components/app-shell";
import { PhoneRedirect } from "@/components/phone-redirect";
import { ScrapViewCard } from "@/components/scrap-view";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listUserScraps } from "@/lib/scraps";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function WithPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.onboardedAt) redirect("/");
  if (!session.user.walkthroughCompletedAt) redirect("/how");
  const { id } = await params;
  const result = await listUserScraps(getDb(), session.user.id, id);
  if (!result) redirect("/today");

  return (
    <AppShell>
      <PhoneRedirect to="/me" />
      <div className="hidden flex-col gap-6 md:flex">
        <h1 className="type-display lowercase">their public scraps</h1>
        {result.scraps.length === 0 ? (
          <p className="text-caption opacity-50">nothing public yet.</p>
        ) : (
          <div className="flex flex-col gap-12">
            {result.scraps.map((scrap) => (
              <ScrapViewCard key={scrap.id} scrap={scrap} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
