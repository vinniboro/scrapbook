import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export default async function QrPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main>
        <p>sign in</p>
      </main>
    );
  }
  if (!session.user.onboardedAt) {
    return (
      <main>
        <p>scan someone first</p>
      </main>
    );
  }
  return (
    <main>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/api/connect/qr" alt="connect" width={320} height={320} />
    </main>
  );
}
