"use client";

import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { cn } from "../../../lib/cn";
import stepperStyles from "./Stepper.module.css";

export type LibraryCardProps = {
  name: string;
  color: string;
  textColor?: string;
  occupation?: string;
  learningStyle?: string;
  setShowColor?: Dispatch<SetStateAction<boolean>>;
};

export function LibraryCard({
  name,
  color,
  textColor,
  occupation,
  learningStyle,
  setShowColor,
}: LibraryCardProps) {
  const isInteractive = setShowColor != null;
  const resolvedColor = color.startsWith("rgb(") ? color : `rgb(${color})`;
  const resolvedText = textColor || "white";
  const isDarkText = resolvedText === "rgb(7, 54, 66)";
  const overlayOpacity = isDarkText ? "opacity-10" : "opacity-20";
  const chipBg = isDarkText ? "bg-black/5" : "bg-white/20";
  const innerDot = isDarkText ? "bg-black/20" : "bg-white/40";
  const hairline = isDarkText ? "border-black/10" : "border-white/20";

  return (
    <div
      className={cn(
        stepperStyles.libraryCard,
        stepperStyles.borderShadow,
        "relative flex aspect-[1.58] w-full flex-col justify-between overflow-hidden rounded-xl will-change-transform",
        "transition-transform duration-300 ease-[var(--ease-out-cubic)]",
        isInteractive
          ? "cursor-pointer hover:scale-[0.98] active:scale-[0.97]"
          : "cursor-default",
      )}
      style={{
        padding: "1vh",
        background: resolvedColor,
        color: resolvedText,
        transition:
          "background-color 300ms var(--ease-out-cubic), scale 300ms var(--ease-out-cubic)",
      }}
      role={isInteractive ? "button" : undefined}
      onClick={
        isInteractive
          ? () => setShowColor((prev) => !prev)
          : undefined
      }
    >
      <div
        className={`pointer-events-none absolute inset-0 ${overlayOpacity}`}
        style={{
          backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative flex items-center gap-2">
        <span
          className={`flex size-6 items-center justify-center rounded-full backdrop-blur-md ${chipBg}`}
        >
          <span className={`size-3 rounded-full ${innerDot}`} />
        </span>
        <span className="text-[10px] font-bold tracking-widest uppercase opacity-90">
          Library Card
        </span>
      </div>

      <div className="relative">
        <h3 className="truncate text-4xl font-bold tracking-tight opacity-95">
          {name.trim() ? name : "Your Name"}
        </h3>
        <div
          className={`mt-1 flex items-end justify-between border-t pt-3 ${hairline}`}
        >
          <div className="flex flex-col">
            <span className="text-[8px] tracking-widest uppercase opacity-70">
              Member Since
            </span>
            <span className="font-mono text-xs font-medium opacity-90">
              {new Date().getFullYear()}
            </span>
          </div>
          <div className="items-end text-right">
            {occupation || learningStyle ? (
              <>
                {occupation ? (
                  <div className="text-[10px] font-medium tracking-wide uppercase opacity-90">
                    {occupation}
                  </div>
                ) : null}
                {learningStyle ? (
                  <div className="max-w-[120px] truncate text-[9px] opacity-75">
                    {learningStyle}
                  </div>
                ) : null}
              </>
            ) : (
              <span className="font-mono text-sm tracking-widest opacity-80">
                •••• ••••
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LibraryCardSwatches({
  colors,
  value,
  onChange,
}: {
  colors: readonly string[];
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div
      className={`${stepperStyles.libraryCard} flex w-full flex-col gap-2`}
      style={{ padding: "1vh" }}
    >
      <label className="text-sm opacity-80">Choose a color</label>
      <div className="grid grid-cols-5 gap-3">
        {colors.map((c) => {
          const selected = c === value;
          return (
            <button
              key={c}
              type="button"
              aria-label={`Select color ${c}`}
              className={cn(
                stepperStyles.swatch,
                "aspect-square rounded-full transition-all duration-200 ease-[var(--ease-out-cubic)]",
                selected
                  ? "scale-110 shadow-md ring-2 ring-gray-400 ring-offset-2"
                  : "opacity-80 hover:scale-105 hover:opacity-100",
              )}
              style={{ backgroundColor: `rgb(${c})` } as CSSProperties}
              onClick={() => onChange(c)}
            />
          );
        })}
      </div>
    </div>
  );
}
