import Link from "next/link";
import { cn } from "../../lib/cn";

type CardProps = {
  href: string;
  thumbnail: React.ReactNode;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  className?: string;
};

export function Card({
  href,
  thumbnail,
  title,
  subtitle,
  meta,
  className,
}: CardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "project-link group flex min-w-0 items-center gap-4 p-2",
        className,
      )}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md shadow-hairline transition-transform duration-base ease-out group-hover:scale-[1.04]">
        {thumbnail}
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <span className="min-w-0 truncate font-medium text-balance">
            {title}
          </span>
          {subtitle ? (
            <span className="text-sm opacity-60">{subtitle}</span>
          ) : null}
        </div>
        {meta}
      </div>
    </Link>
  );
}
