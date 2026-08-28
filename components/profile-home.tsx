"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Checkbox,
  Dialog,
  Input,
  Switch,
} from "@/components/ui";
import {
  CollectionPlate,
  CollectionPlateButton,
} from "@/components/collection-plate";

type GroupRow = { id: string; name: string; role: string };
type AlbumRow = { id: string; title: string };
type Person = { id: string; name: string };

export function ProfileHome({
  name,
  handle,
  groups,
  albums,
  connections,
}: {
  name: string;
  handle: string;
  groups: GroupRow[];
  albums: AlbumRow[];
  connections: Person[];
}) {
  const router = useRouter();
  const [pane, setPane] = useState<"profile" | "collections">("collections");
  const [nextName, setNextName] = useState(name);
  const [nextHandle, setNextHandle] = useState(handle);
  const [groupName, setGroupName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumOpen, setAlbumOpen] = useState(false);
  const [forGroup, setForGroup] = useState(false);
  const [albumGroupId, setAlbumGroupId] = useState(groups[0]?.id ?? "");

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName, handle: nextHandle }),
    });
    router.refresh();
  }

  async function createGroup() {
    const response = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupName }),
    });
    if (!response.ok) return;
    const group = (await response.json()) as { id: string };
    await Promise.all(
      picked.map((userId) =>
        fetch(`/api/groups/${group.id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }),
      ),
    );
    setGroupName("");
    setPicked([]);
    router.refresh();
  }

  async function createAlbum() {
    await fetch("/api/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        forGroup && albumGroupId
          ? { title: albumTitle, visibility: "group", groupId: albumGroupId }
          : { title: albumTitle, visibility: "public" },
      ),
    });
    setAlbumTitle("");
    setForGroup(false);
    setAlbumOpen(false);
    router.refresh();
  }

  const initial = (name || handle || "?").slice(0, 1);

  return (
    <div className="flex flex-col gap-12 py-4">
      <header className="flex items-start gap-5">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-pill bg-secondary text-title font-medium">
          {initial}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
          <h1 className="type-display">{name || "you"}</h1>
          {handle ? (
            <p className="text-caption opacity-50">{handle}</p>
          ) : null}
          <p className="text-caption opacity-50">
            {connections.length}{" "}
            {connections.length === 1 ? "person" : "people"}
            {groups.length > 0
              ? ` · ${groups.length} ${groups.length === 1 ? "room" : "rooms"}`
              : null}
          </p>
        </div>
        <Dialog.Root>
          <Dialog.Trigger
            render={<Button variant="ghost" className="shrink-0" />}
          >
            Edit
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop />
            <Dialog.Popup>
              <Dialog.Title>You</Dialog.Title>
              <form onSubmit={saveProfile} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5 text-caption font-medium">
                  name
                  <Input
                    value={nextName}
                    onChange={(event) => setNextName(event.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-caption font-medium">
                  handle
                  <Input
                    value={nextHandle}
                    onChange={(event) => setNextHandle(event.target.value)}
                  />
                </label>
                <Button type="submit">save</Button>
              </form>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </header>

      <div className="flex gap-1 self-start rounded-pill bg-secondary p-1">
        {(
          [
            ["collections", "Collections"],
            ["profile", "Profile"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPane(id)}
            className={
              pane === id
                ? "min-h-11 rounded-pill bg-background px-4 text-caption font-medium shadow-hairline"
                : "min-h-11 rounded-pill px-4 text-caption font-normal opacity-50"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {pane === "collections" ? (
        <section className="grid grid-cols-2 gap-6 md:grid-cols-3">
          <CollectionPlateButton
            empty
            title="New collection"
            caption="a set of thoughts"
            onClick={() => setAlbumOpen(true)}
          />
          {albums.map((album) => (
            <CollectionPlate
              key={album.id}
              href={`/me/albums/${album.id}`}
              title={album.title}
              caption="collection"
            />
          ))}
        </section>
      ) : (
        <div className="flex flex-col gap-12">
          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-caption font-medium opacity-50">Rooms</h2>
              <Dialog.Root>
                <Dialog.Trigger
                  render={<Button variant="ghost" className="text-caption" />}
                >
                  New room
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Backdrop />
                  <Dialog.Popup>
                    <Dialog.Title>A named channel</Dialog.Title>
                    <Dialog.Description>
                      Only people you have stood with can be invited.
                    </Dialog.Description>
                    <div className="mt-4 flex flex-col gap-3">
                      <Input
                        placeholder="name"
                        value={groupName}
                        onChange={(event) => setGroupName(event.target.value)}
                      />
                      <div className="flex max-h-48 flex-col gap-2 overflow-auto">
                        {connections.map((person) => (
                          <label
                            key={person.id}
                            className="flex items-center gap-2 text-caption"
                          >
                            <Checkbox
                              checked={picked.includes(person.id)}
                              onCheckedChange={(checked) => {
                                setPicked((current) =>
                                  checked
                                    ? [...current, person.id]
                                    : current.filter((id) => id !== person.id),
                                );
                              }}
                            />
                            {person.name}
                          </label>
                        ))}
                      </div>
                      <Button onClick={createGroup}>create</Button>
                    </div>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
            {groups.length === 0 ? (
              <p className="text-caption opacity-50">no rooms yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                {groups.map((group) => (
                  <CollectionPlate
                    key={group.id}
                    href={`/me/groups/${group.id}`}
                    title={group.name}
                    caption={group.role}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-caption font-medium opacity-50">People</h2>
            {connections.length === 0 ? (
              <p className="text-caption opacity-50">
                scan a code. stand with someone.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {connections.map((person) => (
                  <li key={person.id}>
                    <Link
                      href={`/with/${person.id}`}
                      className="hidden min-h-11 items-center type-title md:flex"
                    >
                      {person.name}
                    </Link>
                    <span className="flex min-h-11 items-center type-title md:hidden">
                      {person.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <Dialog.Root open={albumOpen} onOpenChange={setAlbumOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup className="max-w-lg gap-8 rounded-float p-8">
            <Dialog.Title className="text-caption font-normal opacity-50">
              Name this collection
            </Dialog.Title>
            <input
              autoFocus
              value={albumTitle}
              onChange={(event) => setAlbumTitle(event.target.value)}
              placeholder="Untitled"
              className="type-display w-full bg-transparent outline-none placeholder:opacity-30"
            />
            {groups.length > 0 ? (
              <label className="flex items-center justify-between gap-4 text-caption">
                <span className="opacity-70">for a room</span>
                <Switch
                  checked={forGroup}
                  onCheckedChange={(checked) => setForGroup(Boolean(checked))}
                />
              </label>
            ) : null}
            {forGroup ? (
              <select
                className="rounded-card bg-secondary px-3 py-2 text-caption"
                value={albumGroupId}
                onChange={(event) => setAlbumGroupId(event.target.value)}
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            ) : null}
            <Button
              className="w-full"
              disabled={!albumTitle.trim()}
              onClick={createAlbum}
            >
              create
            </Button>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
