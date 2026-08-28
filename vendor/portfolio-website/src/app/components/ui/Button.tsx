"use client";

import { forwardRef } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { mergeClass } from "../../lib/cn";
import { focusRing } from "./styles";

export const buttonVariants = {
  primary:
    "bg-foreground/10 text-foreground hover:shadow-[0_0_20px_0_rgb(var(--secondary-rgb)_/_0.5)]",
  secondary: "bg-secondary shadow-raised",
  tertiary: "hover:bg-foreground/10",
  ghost: "hover:bg-foreground/5",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

type ButtonProps = BaseButton.Props & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
  { variant = "primary", className, type = "button", ...props },
  ref,
) {
  return (
    <BaseButton
      ref={ref}
      type={type}
      className={mergeClass(
        className,
        "inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-pill px-4 py-2",
        "transition-[transform,opacity,background-color,box-shadow] duration-base ease-out",
        "active:scale-[0.96] data-disabled:opacity-40",
        "[&_svg]:size-4 [&_svg]:w-4",
        focusRing,
        buttonVariants[variant],
      )}
      {...props}
    />
  );
});
