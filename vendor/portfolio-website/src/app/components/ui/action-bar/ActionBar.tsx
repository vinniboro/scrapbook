"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Tooltip, TooltipProvider } from "../Tooltip";
import { cn } from "../../../lib/cn";
import {
  BLUR_SWAP,
  EASE_OUT_QUINT,
  ICON_ANIMATION_DURATION,
  ICON_VARIANTS,
  PANEL_ANIMATION_DURATION,
  SPRING_DURATION,
} from "./motion";
import { useActionBarMeasure } from "./useActionBarMeasure";
import styles from "./ActionBar.module.css";

export type ActionBarSide = "bottom" | "top";

export type ActionBarButtonItem = {
  id: string;
  kind?: "button";
  label: string;
  icon: ReactNode;
  iconKey?: string;
  tooltip?: string;
  active?: boolean;
  panel?: ReactNode;
  onSelect?: () => void;
};

export type ActionBarSlotItem = {
  id: string;
  kind: "slot";
  content: ReactNode;
};

export type ActionBarItem = ActionBarButtonItem | ActionBarSlotItem;

function isButtonItem(item: ActionBarItem): item is ActionBarButtonItem {
  return item.kind !== "slot";
}

export function ActionBar({
  items,
  side = "bottom",
  leading,
  trailing,
  embedded = false,
  onOpenChange,
}: {
  items: ActionBarItem[];
  /** `bottom` pins to the bottom and the panel grows up. `top` pins to the top and grows down. */
  side?: ActionBarSide;
  leading?: ReactNode;
  trailing?: ReactNode;
  embedded?: boolean;
  onOpenChange?: (id: string | null) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>(null);
  const [measureRef, bounds] = useActionBarMeasure<HTMLDivElement>();
  const fromBottom = side === "bottom";

  const openItem = items.find(
    (item): item is ActionBarButtonItem =>
      isButtonItem(item) && item.id === openId && Boolean(item.panel),
  );
  const controls = openItem?.id ?? "";

  const closePanel = () => {
    setOpenId(null);
    onOpenChange?.(null);
  };

  const openPanel = (id: string) => {
    const next = openId === id ? null : id;
    setOpenId(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat) return;
      if (e.key !== "Escape") return;
      if (!controls) return;
      e.preventDefault();
      setOpenId(null);
      onOpenChange?.(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [controls, onOpenChange]);

  return (
    <TooltipProvider delay={200}>
      {controls ? (
        <button
          type="button"
          data-hover="false"
          onClick={closePanel}
          className={cn(
            "inset-0 h-full min-h-full w-full min-w-full bg-black/20",
            embedded ? "absolute" : "fixed",
          )}
          style={{ top: 0, left: 0, right: 0, bottom: 0, zIndex: 99998 }}
          aria-label="Close panel"
        />
      ) : null}

      <div
        className={cn(
          "pointer-events-none flex justify-center",
          embedded ? "absolute inset-x-0" : "fixed inset-x-0",
          fromBottom ? "bottom-4" : "top-4",
        )}
        style={{ zIndex: 100001 }}
      >
        <motion.div
          className={cn(
            styles.root,
            "pointer-events-auto flex flex-col overflow-hidden rounded-3xl bg-secondary shadow-raised",
          )}
          animate={{
            width: bounds.width > 0 ? bounds.width : "auto",
            height: bounds.height > 50 ? bounds.height : "auto",
          }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: "spring", bounce: 0, duration: SPRING_DURATION }
          }
        >
          <div ref={measureRef} className="h-fit w-fit">
            <AnimatePresence initial={false} mode="wait">
              {openItem ? (
                <motion.div
                  key={`panel-${openItem.id}`}
                  className="flex flex-col gap-2"
                  style={{ padding: 6 }}
                  variants={BLUR_SWAP}
                  initial={shouldReduceMotion ? { opacity: 0 } : "hidden"}
                  animate={shouldReduceMotion ? { opacity: 1 } : "visible"}
                  exit={shouldReduceMotion ? { opacity: 0 } : "hidden"}
                  transition={{
                    duration: PANEL_ANIMATION_DURATION,
                    ease: EASE_OUT_QUINT,
                  }}
                >
                  <div className="flex w-full items-center">
                    <button
                      type="button"
                      data-hover="true"
                      className="min-h-11 w-fit gap-2 rounded-xl px-2 text-lg font-semibold"
                      onClick={closePanel}
                    >
                      <ArrowLeft />
                      {openItem.id}
                    </button>
                  </div>
                  {openItem.panel}
                </motion.div>
              ) : (
                <motion.div
                  key="toolbar"
                  className="flex flex-row items-center py-0.5 pr-1 pl-1"
                  variants={BLUR_SWAP}
                  initial={shouldReduceMotion ? { opacity: 0 } : "hidden"}
                  animate={shouldReduceMotion ? { opacity: 1 } : "visible"}
                  exit={shouldReduceMotion ? { opacity: 0 } : "hidden"}
                  transition={{
                    duration: PANEL_ANIMATION_DURATION,
                    ease: EASE_OUT_QUINT,
                  }}
                >
                  {leading ? (
                    <div className={styles.slot}>{leading}</div>
                  ) : null}
                  {items.map((item) =>
                    isButtonItem(item) ? (
                      <DockIconButton
                        key={item.id}
                        item={item}
                        shouldReduceMotion={!!shouldReduceMotion}
                        onActivate={() => {
                          if (item.panel) openPanel(item.id);
                          item.onSelect?.();
                        }}
                      />
                    ) : (
                      <div key={item.id} className={styles.slot}>
                        {item.content}
                      </div>
                    ),
                  )}
                  {trailing ? (
                    <div className={styles.slot}>{trailing}</div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}

function DockIconButton({
  item,
  shouldReduceMotion,
  onActivate,
}: {
  item: ActionBarButtonItem;
  shouldReduceMotion: boolean;
  onActivate: () => void;
}) {
  const label = item.tooltip ?? item.label;
  const icon = (
    <span className="flex size-6 items-center justify-center">
      {item.iconKey ? (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={item.iconKey}
            className="flex"
            variants={ICON_VARIANTS}
            initial={shouldReduceMotion ? false : "hidden"}
            animate="visible"
            exit={shouldReduceMotion ? undefined : "hidden"}
            transition={{
              duration: ICON_ANIMATION_DURATION,
              ease: EASE_OUT_QUINT,
            }}
          >
            {item.icon}
          </motion.span>
        </AnimatePresence>
      ) : (
        item.icon
      )}
    </span>
  );

  return (
    <Tooltip content={label} delay={200} className="z-[100050]">
      <button
        type="button"
        className="rounded-full"
        data-size="icon"
        aria-label={label}
        data-state={item.active ? "active" : ""}
        onClick={onActivate}
      >
        {icon}
      </button>
    </Tooltip>
  );
}
