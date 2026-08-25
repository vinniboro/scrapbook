import { auth, signIn } from "@/lib/auth";
import { redeemToken } from "@/lib/connect";
import { getDb } from "@/lib/db";
import { headers } from "next/headers";

export const runtime = "nodejs";

export default async function KnowPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    await signIn("google", { redirectTo: `/know/${token}` });
    return null;
  }

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const result = await redeemToken(getDb(), {
    viewerId: session.user.id,
    token,
    ip,
  });

  if (!result.ok) {
    return (
      <main>
        <p>{result.code}</p>
      </main>
    );
  }

  return (
    <main>
      <p>connected</p>
    </main>
  );
}
