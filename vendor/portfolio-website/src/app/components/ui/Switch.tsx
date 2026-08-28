"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { mergeClass } from "../../lib/cn";
import { focusRing } from "./styles";

export function Switch({ className, ...props }: BaseSwitch.Root.Props) {
  return (
    <BaseSwitch.Root
      className={mergeClass(
        className,
        "flex h-6 w-11 shrink-0 items-center rounded-pill bg-foreground/10 p-0.5",
        "transition-[background-color,opacity] duration-fast ease-out",
        "data-checked:bg-foreground data-disabled:opacity-40",
        focusRing,
      )}
      {...props}
    >
      <BaseSwitch.Thumb className="size-5 rounded-pill bg-background shadow-hairline transition-transform duration-fast ease-out data-checked:translate-x-5" />
    </BaseSwitch.Root>
  );
}
