"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { fieldControl, focusRing, iconBox, popup } from "./styles";

export type SelectItem = {
  label: string;
  value: string;
};

type SelectProps = Omit<BaseSelect.Root.Props<string>, "items" | "children"> & {
  items: readonly SelectItem[];
  placeholder?: string;
  className?: string;
};

export function Select({
  items,
  placeholder = "Select",
  className,
  ...props
}: SelectProps) {
  return (
    <BaseSelect.Root items={items} {...props}>
      <BaseSelect.Trigger
        className={cn(
          fieldControl,
          "flex h-11 min-w-44 items-center justify-between gap-3 text-left",
          className,
        )}
      >
        <BaseSelect.Value placeholder={placeholder} />
        <BaseSelect.Icon className={iconBox}>
          <ChevronDown aria-hidden />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          className="z-overlay outline-none"
          sideOffset={8}
          alignItemWithTrigger={false}
        >
          <BaseSelect.Popup
            className={cn(popup, "min-w-[var(--anchor-width)] py-1")}
          >
            <BaseSelect.List className="max-h-[min(20rem,var(--available-height))] overflow-y-auto">
              {items.map((item) => (
                <BaseSelect.Item
                  key={item.value}
                  value={item.value}
                  className={cn(
                    "grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 px-3 py-2 text-sm outline-none select-none",
                    "data-highlighted:bg-foreground/10",
                    focusRing,
                  )}
                >
                  <BaseSelect.ItemIndicator className={iconBox}>
                    <Check strokeWidth={2.5} aria-hidden />
                  </BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText className="col-start-2">
                    {item.label}
                  </BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
