import Link from "next/link";
import { cn } from "@/components/ui";

type PlateBody = {
  title: string;
  caption?: string;
  coverSrc?: string | null;
  empty?: boolean;
  className?: string;
};

function PlateFace({ title, caption, coverSrc, empty, className }: PlateBody) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className={cn(
          "relative aspect-[4/5] overflow-hidden rounded-plate bg-secondary shadow-hairline",
          empty && "flex items-center justify-center",
        )}
      >
        {coverSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt=""
            className="no-media-frame absolute inset-0 size-full object-cover"
          />
        ) : (
          <span className="type-display opacity-50">
            {empty ? "+" : title.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-0.5">
        <p className="text-caption font-medium">{title}</p>
        {caption ? (
          <p className="text-caption opacity-50">{caption}</p>
        ) : null}
      </div>
    </div>
  );
}

export function CollectionPlate({
  href,
  ...body
}: PlateBody & { href: string }) {
  return (
    <Link href={href} className="block motion-safe:transition-opacity motion-safe:duration-base hover:opacity-80">
      <PlateFace {...body} />
    </Link>
  );
}

export function CollectionPlateButton({
  onClick,
  ...body
}: PlateBody & { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-auto w-full flex-col items-stretch rounded-none p-0 text-left"
    >
      <PlateFace {...body} />
    </button>
  );
}
