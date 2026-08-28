import { AppShell } from "@/components/app-shell";
import { CaptureForm } from "@/components/capture-form";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listGroupsForUser } from "@/lib/groups";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function UpPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.onboardedAt) redirect("/");
  if (!session.user.walkthroughCompletedAt) redirect("/how");
  const groups = await listGroupsForUser(getDb(), session.user.id);
  return (
    <AppShell>
      <CaptureForm
        groups={groups.map((group) => ({ id: group.id, name: group.name }))}
      />
    </AppShell>
  );
}
