import { cn } from "../../lib/cn";
import type { CSSProperties } from "react";

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
};

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-sm bg-foreground/10", className)}
      style={style}
      aria-hidden
    />
  );
}
