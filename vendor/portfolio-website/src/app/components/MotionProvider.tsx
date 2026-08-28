"use client";

import { MotionConfig } from "framer-motion";
import { spring } from "../lib/motion";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={spring.page}>
      {children}
    </MotionConfig>
  );
}
