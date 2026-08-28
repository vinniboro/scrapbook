"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { mergeClass } from "../../lib/cn";
import { focusRing } from "./styles";

export function RadioGroup({ className, ...props }: BaseRadioGroup.Props) {
  return (
    <BaseRadioGroup
      className={mergeClass(className, "flex flex-col items-start gap-2")}
      {...props}
    />
  );
}

export function Radio({ className, ...props }: BaseRadio.Root.Props) {
  return (
    <BaseRadio.Root
      className={mergeClass(
        className,
        "flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground/[0.04] p-0 shadow-hairline",
        "transition-[background-color,opacity,transform] duration-fast ease-out",
        "data-checked:bg-foreground data-disabled:opacity-40 active:scale-[0.96]",
        focusRing,
      )}
      {...props}
    >
      <BaseRadio.Indicator className="flex items-center justify-center data-unchecked:hidden before:size-2 before:rounded-full before:bg-background" />
    </BaseRadio.Root>
  );
}
