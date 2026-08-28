import { cn } from "../../lib/cn";

export function CardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[repeat(auto-fill,minmax(min(100%,450px),1fr))] gap-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}
