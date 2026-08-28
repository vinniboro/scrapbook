"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ScrapViewCard } from "@/components/scrap-view";
import { spring } from "@/components/ui";
import type { ScrapView } from "@/lib/scraps";

export function SittingStack({ scraps }: { scraps: ScrapView[] }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  if (reduce) {
    return (
      <ol className="flex flex-col gap-16">
        {scraps.map((scrap) => (
          <li key={scrap.id}>
            <ScrapViewCard scrap={scrap} />
          </li>
        ))}
        <p className="type-essay">That is all for today.</p>
      </ol>
    );
  }

  if (index >= scraps.length) {
    return <p className="type-display">That is all for today.</p>;
  }

  const current = scraps[index];
  const behind = scraps.slice(index + 1, index + 3);

  return (
    <div className="relative mx-auto min-h-[28rem] w-full max-w-lg">
      {behind
        .slice()
        .reverse()
        .map((scrap, i) => (
          <div
            key={scrap.id}
            className="absolute inset-x-0 top-0"
            style={{
              transform: `translateY(${(i + 1) * 10}px) scale(${1 - (i + 1) * 0.04})`,
            }}
          >
            <ScrapViewCard scrap={scrap} />
          </div>
        ))}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={current.id}
          className="relative z-10 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 80) setIndex((value) => value + 1);
          }}
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, x: 180 }}
          transition={spring.base}
          onClick={() => setIndex((value) => value + 1)}
        >
          <ScrapViewCard scrap={current} />
        </motion.div>
      </AnimatePresence>
      <p className="mt-10 text-caption opacity-50">
        {index + 1} / {scraps.length}
      </p>
    </div>
  );
}
