"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { ScrapViewCard } from "@/components/scrap-view";
import type { ScrapView } from "@/lib/scraps";
import Link from "next/link";

export function GroupChannel({
  groupId,
  name,
  isOwner,
  scraps,
  members,
  connections,
}: {
  groupId: string;
  name: string;
  isOwner: boolean;
  scraps: ScrapView[];
  members: { id: string; name: string; isOwner?: boolean }[];
  connections: { id: string; name: string }[];
}) {
  const router = useRouter();

  async function addMember(userId: string) {
    await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    router.refresh();
  }

  async function removeMember(userId: string) {
    await fetch(`/api/groups/${groupId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8 py-8">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="type-display">{name}</h1>
        <Link href="/up" className="text-caption opacity-70">
          place here
        </Link>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-caption font-medium opacity-50">Members</h2>
        <ul className="flex flex-col gap-2">
          {members.map((person) => (
            <li key={person.id} className="flex items-center justify-between">
              <span>{person.name}</span>
              {isOwner && !person.isOwner ? (
                <Button variant="ghost" onClick={() => removeMember(person.id)}>
                  remove
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {isOwner && connections.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-caption opacity-50">invite</p>
            {connections.map((person) => (
              <Button
                key={person.id}
                variant="ghost"
                onClick={() => addMember(person.id)}
              >
                add {person.name}
              </Button>
            ))}
          </div>
        ) : null}
      </section>
      <section className="flex flex-col gap-6">
        <h2 className="text-caption font-medium opacity-50">Channel</h2>
        {scraps.length === 0 ? (
          <p className="text-caption opacity-50">empty so far.</p>
        ) : (
          <div className="grid grid-cols-1 gap-10">
            {scraps.map((scrap) => (
              <ScrapViewCard key={scrap.id} scrap={scrap} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
