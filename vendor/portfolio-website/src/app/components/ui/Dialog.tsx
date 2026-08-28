"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { mergeClass } from "../../lib/cn";
import { focusRing } from "./styles";

function Trigger({ className, ...props }: BaseDialog.Trigger.Props) {
  return <BaseDialog.Trigger className={className} {...props} />;
}

function Backdrop({ className, ...props }: BaseDialog.Backdrop.Props) {
  return (
    <BaseDialog.Backdrop
      className={mergeClass(
        className,
        "fixed inset-0 min-h-dvh bg-black/30 backdrop-blur-md",
        "transition-opacity duration-fast ease-out",
        "data-starting-style:opacity-0 data-ending-style:opacity-0",
        "supports-[-webkit-touch-callout:none]:absolute",
      )}
      {...props}
    />
  );
}

function Popup({ className, ...props }: BaseDialog.Popup.Props) {
  return (
    <BaseDialog.Popup
      className={mergeClass(
        className,
        "fixed top-1/2 left-1/2 z-modal flex w-full max-w-md -translate-x-1/2 -translate-y-1/2",
        "flex-col gap-4 rounded-panel bg-background p-6 text-foreground shadow-overlay",
        "origin-center outline-none",
        "transition-[scale,opacity] duration-fast ease-out",
        "data-starting-style:scale-[0.97] data-starting-style:opacity-0",
        "data-ending-style:scale-[0.97] data-ending-style:opacity-0",
      )}
      {...props}
    />
  );
}

function Title({ className, ...props }: BaseDialog.Title.Props) {
  return (
    <BaseDialog.Title
      className={mergeClass(className, "text-title font-medium text-balance")}
      {...props}
    />
  );
}

function Description({ className, ...props }: BaseDialog.Description.Props) {
  return (
    <BaseDialog.Description
      className={mergeClass(className, "text-body text-pretty opacity-70")}
      {...props}
    />
  );
}

function Close({ className, ...props }: BaseDialog.Close.Props) {
  return (
    <BaseDialog.Close
      className={mergeClass(
        className,
        "inline-flex min-h-11 w-fit items-center justify-center rounded-pill px-4 py-2",
        "bg-secondary shadow-raised transition-[transform,opacity] duration-base ease-out",
        "active:scale-[0.96]",
        focusRing,
      )}
      {...props}
    />
  );
}

export const Dialog = {
  Root: BaseDialog.Root,
  Trigger,
  Portal: BaseDialog.Portal,
  Backdrop,
  Popup,
  Title,
  Description,
  Close,
};
