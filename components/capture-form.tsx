"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Radio, RadioGroup, Textarea } from "@/components/ui";
import { CreateSheet, type PlaceKind } from "@/components/create-sheet";
import type { BookHit } from "@/lib/books";

type GroupOption = { id: string; name: string };

export function CaptureForm({ groups }: { groups: GroupOption[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<PlaceKind>("image");
  const [visibility, setVisibility] = useState<"public" | "group">("public");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [bookQuery, setBookQuery] = useState("");
  const [books, setBooks] = useState<BookHit[]>([]);
  const [book, setBook] = useState<BookHit | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const q = bookQuery.trim();
    if (!q) return;
    const handle = window.setTimeout(async () => {
      const response = await fetch(
        `/api/books/search?q=${encodeURIComponent(q)}`,
      );
      if (!response.ok) return;
      const json = (await response.json()) as { books: BookHit[] };
      setBooks(json.books);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [bookQuery]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const audience = {
      visibility,
      groupId: visibility === "group" ? groupId : undefined,
    };
    try {
      let response: Response;
      if (kind === "image") {
        const file = new FormData(event.currentTarget).get("file");
        const form = new FormData();
        form.set("type", "image");
        form.set("visibility", visibility);
        if (audience.groupId) form.set("groupId", audience.groupId);
        if (file instanceof File) form.set("file", file);
        response = await fetch("/api/scraps", { method: "POST", body: form });
      } else if (kind === "book") {
        if (!book) {
          setError("pick a book");
          setPending(false);
          return;
        }
        response = await fetch("/api/scraps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "book", ...audience, ...book }),
        });
      } else if (kind === "music") {
        response = await fetch("/api/scraps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "music",
            ...audience,
            musicUrl,
            musicTitle,
          }),
        });
      } else {
        response = await fetch("/api/scraps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "text", ...audience, body }),
        });
      }
      if (!response.ok) {
        const json = (await response.json()) as { error?: string };
        setError(json.error ?? "could not place");
        setPending(false);
        return;
      }
      router.push("/today");
      router.refresh();
    } catch {
      setError("could not place");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-10 py-4">
      <div className="flex flex-col gap-3">
        <h1 className="type-display">What have you been up to?</h1>
        <CreateSheet value={kind} onChange={setKind} />
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-caption font-medium opacity-50">
          where this goes
        </legend>
        <RadioGroup
          value={visibility}
          onValueChange={(value) => setVisibility(value as typeof visibility)}
          aria-label="audience"
          className="flex flex-col gap-2"
        >
          <label className="flex min-h-11 items-center gap-2 text-caption">
            <Radio value="public" />
            close — people you have stood with
          </label>
          <label className="flex min-h-11 items-center gap-2 text-caption">
            <Radio value="group" />
            a room
          </label>
        </RadioGroup>
        {visibility === "group" ? (
          <select
            className="rounded-card bg-secondary px-3 py-2 text-caption"
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
            required
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        ) : null}
      </fieldset>
      {kind === "text" ? (
        <label className="flex flex-col gap-2 text-caption font-medium opacity-70">
          words
          <Textarea
            required
            rows={8}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="text-body"
          />
        </label>
      ) : null}
      {kind === "image" ? (
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            className="sr-only"
            onChange={(event) =>
              setFileName(event.target.files?.[0]?.name ?? null)
            }
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-auto min-h-40 w-full flex-col gap-2 rounded-plate bg-secondary px-6 py-10 text-caption font-medium"
          >
            <span>{fileName ?? "choose a photograph"}</span>
            <span className="font-normal opacity-50">jpeg, png, webp, gif</span>
          </button>
        </div>
      ) : null}
      {kind === "book" ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-2 text-caption font-medium opacity-70">
            find a book
            <Input
              value={bookQuery}
              onChange={(event) => setBookQuery(event.target.value)}
              placeholder="title or author"
            />
          </label>
          <ul className="flex flex-col gap-1">
            {bookQuery.trim()
              ? books.map((hit) => (
                  <li key={hit.googleVolumeId}>
                    <button
                      type="button"
                      onClick={() => setBook(hit)}
                      className={`h-auto w-full justify-start rounded-plate px-4 py-3 text-left text-caption ${book?.googleVolumeId === hit.googleVolumeId ? "bg-secondary" : ""}`}
                    >
                      {hit.bookTitle}
                      {hit.bookAuthors ? ` — ${hit.bookAuthors}` : ""}
                    </button>
                  </li>
                ))
              : null}
          </ul>
        </div>
      ) : null}
      {kind === "music" ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-2 text-caption font-medium opacity-70">
            link
            <Input
              required
              value={musicUrl}
              onChange={(event) => setMusicUrl(event.target.value)}
              placeholder="https://"
            />
          </label>
          <label className="flex flex-col gap-2 text-caption font-medium opacity-70">
            title
            <Input
              value={musicTitle}
              onChange={(event) => setMusicTitle(event.target.value)}
            />
          </label>
        </div>
      ) : null}
      {error ? <p className="text-caption opacity-70">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        place
      </Button>
    </form>
  );
}
