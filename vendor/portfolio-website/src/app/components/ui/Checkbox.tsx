"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";
import { mergeClass } from "../../lib/cn";
import { focusRing, iconBox } from "./styles";

export function Checkbox({ className, ...props }: BaseCheckbox.Root.Props) {
  return (
    <BaseCheckbox.Root
      className={mergeClass(
        className,
        "flex size-5 shrink-0 items-center justify-center rounded-sm bg-foreground/[0.04] p-0 shadow-hairline",
        "transition-[background-color,opacity,transform] duration-fast ease-out",
        "data-checked:bg-foreground data-checked:text-background",
        "data-disabled:opacity-40 active:scale-[0.96]",
        focusRing,
      )}
      {...props}
    >
      <BaseCheckbox.Indicator className={`${iconBox} data-unchecked:hidden`}>
        <Check strokeWidth={2.5} aria-hidden />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
