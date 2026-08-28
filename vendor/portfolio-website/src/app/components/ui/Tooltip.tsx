"use client";

import type { ReactElement, ReactNode } from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cn } from "../../lib/cn";
import { popup } from "./styles";

export const TooltipProvider = BaseTooltip.Provider;

export function Tooltip({
  content,
  children,
  side = "top",
  delay,
  className,
}: {
  content: ReactNode;
  children: ReactElement;
  side?: BaseTooltip.Positioner.Props["side"];
  delay?: number;
  className?: string;
}) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger delay={delay} render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={8}>
          <BaseTooltip.Popup
            className={cn(
              popup,
              className ?? "z-overlay",
              "px-2.5 py-1.5 text-sm data-instant:transition-none",
            )}
          >
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
