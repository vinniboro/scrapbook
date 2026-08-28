import { AppShell } from "@/components/app-shell";
import { ProfileHome } from "@/components/profile-home";
import { auth } from "@/lib/auth";
import { listAlbumsForAuthor } from "@/lib/albums";
import { listConnections } from "@/lib/connections";
import { getDb } from "@/lib/db";
import { listGroupsForUser } from "@/lib/groups";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function MePage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.onboardedAt) redirect("/");
  if (!session.user.walkthroughCompletedAt) redirect("/how");
  const db = getDb();
  const [groups, albums, connections] = await Promise.all([
    listGroupsForUser(db, session.user.id),
    listAlbumsForAuthor(db, session.user.id),
    listConnections(db, session.user.id),
  ]);
  return (
    <AppShell>
      <ProfileHome
        name={session.user.name ?? ""}
        handle={session.user.handle ?? ""}
        groups={groups.map((group) => ({
          id: group.id,
          name: group.name,
          role: group.role,
        }))}
        albums={albums.map((album) => ({ id: album.id, title: album.title }))}
        connections={connections.map((person) => ({
          id: person.id,
          name: person.name ?? person.handle ?? "member",
        }))}
      />
    </AppShell>
  );
}
