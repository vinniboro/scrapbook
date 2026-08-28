import { auth, signIn } from "@/lib/auth";
import { redeemToken } from "@/lib/connect";
import { getDb } from "@/lib/db";
import { isPhone } from "@/lib/device";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const result = await redeemToken(getDb(), {
    viewerId: session.user.id,
    token,
    ip,
  });

  if (!result.ok) {
    return (
      <main className="p-8">
        <p>{result.code}</p>
      </main>
    );
  }

  const phone = isPhone(headerList.get("user-agent"));
  if (!session.user.walkthroughCompletedAt) {
    redirect("/how");
  }
  redirect(phone ? "/me" : "/today");
}
