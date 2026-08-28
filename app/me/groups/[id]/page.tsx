import { AppShell } from "@/components/app-shell";
import { GroupChannel } from "@/components/group-channel";
import { auth } from "@/lib/auth";
import { listConnections } from "@/lib/connections";
import { getDb } from "@/lib/db";
import { isGroupMember, listGroupMembers, listGroupsForUser } from "@/lib/groups";
import { listGroupScraps } from "@/lib/scraps";
import { users } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.onboardedAt) redirect("/");
  if (!session.user.walkthroughCompletedAt) redirect("/how");
  const { id } = await params;
  const db = getDb();
  const membership = await isGroupMember(db, id, session.user.id);
  if (!membership) redirect("/me");
  const groups = await listGroupsForUser(db, session.user.id);
  const group = groups.find((row) => row.id === id);
  if (!group) redirect("/me");
  const [feed, memberRows, connections] = await Promise.all([
    listGroupScraps(db, session.user.id, id),
    listGroupMembers(db, id),
    listConnections(db, session.user.id),
  ]);
  const memberIds = memberRows.map((row) => row.userId);
  const people =
    memberIds.length === 0
      ? []
      : await db
          .select({
            id: users.id,
            name: users.name,
            handle: users.handle,
          })
          .from(users)
          .where(inArray(users.id, memberIds));

  return (
    <AppShell>
      <GroupChannel
        groupId={id}
        name={group.name}
        isOwner={group.ownerId === session.user.id}
        scraps={feed?.scraps ?? []}
        members={people.map((person) => ({
          id: person.id,
          name: person.name ?? person.handle ?? "member",
          isOwner: person.id === group.ownerId,
        }))}
        connections={connections
          .filter((person) => !memberIds.includes(person.id))
          .map((person) => ({
            id: person.id,
            name: person.name ?? person.handle ?? "member",
          }))}
      />
    </AppShell>
  );
}
