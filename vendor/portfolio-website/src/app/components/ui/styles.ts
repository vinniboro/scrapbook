import { cn } from "../../lib/cn";

export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent/70";

export const fieldControl = cn(
  "w-full rounded-card bg-foreground/[0.04] px-3 text-body text-foreground shadow-hairline",
  "transition-[box-shadow,background-color,opacity] duration-fast ease-out",
  "placeholder:text-foreground/40",
  "data-disabled:opacity-40 disabled:opacity-40",
  focusRing,
);

export const popup = cn(
  "origin-[var(--transform-origin)] rounded-card bg-background text-foreground shadow-overlay",
  "transition-[transform,opacity] duration-fast ease-out",
  "data-starting-style:scale-[0.97] data-starting-style:opacity-0",
  "data-ending-style:scale-[0.97] data-ending-style:opacity-0",
);

export const iconBox = "flex size-4 shrink-0 items-center justify-center [&_svg]:size-4 [&_svg]:w-4";
