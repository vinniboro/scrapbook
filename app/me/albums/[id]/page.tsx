import { AppShell } from "@/components/app-shell";
import { AlbumEditor } from "@/components/album-editor";
import { getAlbumForViewer } from "@/lib/albums";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getScrapForViewer, listUserScraps, serializeScrap } from "@/lib/scraps";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.onboardedAt) redirect("/");
  if (!session.user.walkthroughCompletedAt) redirect("/how");
  const { id } = await params;
  const db = getDb();
  const result = await getAlbumForViewer(db, session.user.id, id);
  if (!result) redirect("/me");
  const scraps = [];
  for (const item of result.items) {
    const scrap = await getScrapForViewer(db, session.user.id, item.scrapId);
    if (scrap) scraps.push(serializeScrap(scrap));
  }
  const mine = await listUserScraps(db, session.user.id, session.user.id);
  const own = mine?.scraps ?? [];

  return (
    <AppShell>
      <AlbumEditor
        albumId={id}
        title={result.album.title}
        isOwner={result.album.authorId === session.user.id}
        scraps={scraps}
        candidates={own}
      />
    </AppShell>
  );
}
