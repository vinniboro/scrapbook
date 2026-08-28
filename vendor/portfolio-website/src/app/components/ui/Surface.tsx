import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "../../lib/cn";

export const surfaceVariants = {
  raised: "bg-background shadow-raised",
  glass: "glass-effect",
  flat: "bg-secondary",
} as const;

export type SurfaceVariant = keyof typeof surfaceVariants;

type SurfaceProps<T extends ElementType> = {
  as?: T;
  variant?: SurfaceVariant;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "variant">;

export function Surface<T extends ElementType = "div">({
  as,
  variant = "raised",
  className,
  ...props
}: SurfaceProps<T>) {
  const Comp = as ?? "div";
  return (
    <Comp className={cn(surfaceVariants[variant], className)} {...props} />
  );
}
