"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { ScrapViewCard } from "@/components/scrap-view";
import type { ScrapView } from "@/lib/scraps";

export function AlbumEditor({
  albumId,
  title,
  isOwner,
  scraps,
  candidates,
}: {
  albumId: string;
  title: string;
  isOwner: boolean;
  scraps: ScrapView[];
  candidates: ScrapView[];
}) {
  const router = useRouter();
  const inAlbum = new Set(scraps.map((scrap) => scrap.id));

  async function add(scrapId: string) {
    await fetch(`/api/albums/${albumId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scrapId }),
    });
    router.refresh();
  }

  async function remove(scrapId: string) {
    await fetch(`/api/albums/${albumId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scrapId }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-10 py-4">
      <h1 className="type-display">{title}</h1>
      {scraps.length === 0 ? (
        <p className="text-caption opacity-50">empty collection.</p>
      ) : (
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {scraps.map((scrap) => (
            <div key={scrap.id} className="flex flex-col gap-2">
              <ScrapViewCard scrap={scrap} />
              {isOwner ? (
                <Button variant="ghost" onClick={() => remove(scrap.id)}>
                  remove
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
      {isOwner ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-caption font-medium opacity-50">
            Add from your scraps
          </h2>
          <ul className="flex flex-col gap-1">
            {candidates
              .filter((scrap) => !inAlbum.has(scrap.id))
              .map((scrap) => (
                <li
                  key={scrap.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="truncate text-caption">
                    {scrap.body ||
                      scrap.book?.title ||
                      scrap.music?.title ||
                      scrap.type}
                  </span>
                  <Button variant="ghost" onClick={() => add(scrap.id)}>
                    add
                  </Button>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
