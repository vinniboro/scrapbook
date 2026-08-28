import type { ScrapView } from "@/lib/scraps";
import { cn } from "@/components/ui";

function audienceLabel(visibility: ScrapView["visibility"]) {
  return visibility === "public" ? "close" : "a room";
}

export function ScrapViewCard({
  scrap,
  className,
}: {
  scrap: ScrapView;
  className?: string;
}) {
  const caption = audienceLabel(scrap.visibility);

  return (
    <article className={cn("flex flex-col gap-3", className)}>
      {scrap.type === "image" && scrap.image ? (
        <div className="overflow-hidden rounded-plate shadow-hairline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scrap.image}
            alt=""
            className="no-media-frame block w-full object-cover"
          />
        </div>
      ) : null}

      {scrap.type === "text" ? (
        <div className="px-0.5 py-2">
          <p className="type-essay whitespace-pre-wrap">{scrap.body}</p>
        </div>
      ) : null}

      {scrap.type === "book" && scrap.book ? (
        <div className="flex gap-5">
          {scrap.book.thumbnailUrl ? (
            <div className="overflow-hidden rounded-card shadow-hairline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={scrap.book.thumbnailUrl}
                alt=""
                width={96}
                height={144}
                className="no-media-frame h-36 w-24 object-cover"
              />
            </div>
          ) : null}
          <div className="flex flex-col justify-end gap-1 py-1">
            <p className="type-title">{scrap.book.title}</p>
            {scrap.book.authors ? (
              <p className="text-caption opacity-50">{scrap.book.authors}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {scrap.type === "music" && scrap.music ? (
        <div className="flex flex-col gap-1 rounded-plate bg-secondary px-5 py-6">
          <p className="text-caption opacity-50">{scrap.music.provider}</p>
          <a
            href={scrap.music.url ?? "#"}
            className="type-title"
          >
            {scrap.music.title || scrap.music.url}
          </a>
        </div>
      ) : null}

      <p className="text-caption opacity-50">{caption}</p>
    </article>
  );
}
