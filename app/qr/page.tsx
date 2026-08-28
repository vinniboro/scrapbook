import { AppShell } from "@/components/app-shell";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function QrPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  if (!session.user.onboardedAt) redirect("/");
  if (!session.user.walkthroughCompletedAt) redirect("/how");

  return (
    <AppShell>
      <div className="flex flex-col items-center gap-8 py-10">
        <div className="flex flex-col items-center gap-2">
          <h1 className="type-display lowercase">your code</h1>
          <p className="max-w-sm text-center text-caption opacity-50 md:hidden">
            Let them scan this.
          </p>
          <p className="hidden max-w-sm text-center text-caption opacity-50 md:block">
            Show this on your screen. Scanning happens on a phone.
          </p>
        </div>
        <div className="overflow-hidden rounded-plate bg-background p-4 shadow-hairline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/api/connect/qr"
            alt="connect"
            width={320}
            height={320}
            className="no-media-frame block"
          />
        </div>
      </div>
    </AppShell>
  );
}
