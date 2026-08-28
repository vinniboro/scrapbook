"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import { mergeClass } from "../../lib/cn";

type SliderProps = BaseSlider.Root.Props & {
  "aria-label"?: string;
};

export function Slider({
  className,
  "aria-label": ariaLabel = "Value",
  ...props
}: SliderProps) {
  return (
    <BaseSlider.Root className={mergeClass(className, "w-56")} {...props}>
      <BaseSlider.Control className="flex w-full touch-none select-none items-center py-3">
        <BaseSlider.Track className="h-1 w-full rounded-pill bg-foreground/10 select-none">
          <BaseSlider.Indicator className="rounded-pill bg-foreground select-none" />
          <BaseSlider.Thumb
            aria-label={ariaLabel}
            className="size-4 rounded-pill bg-background shadow-raised select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/70"
          />
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
