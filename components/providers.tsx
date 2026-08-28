"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { MotionConfig } from "framer-motion";
import { spring } from "portfolio-website/motion";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={spring.page}>
      <Tooltip.Provider delay={400}>{children}</Tooltip.Provider>
    </MotionConfig>
  );
}
