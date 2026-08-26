"use client";

import { TooltipProvider } from "portfolio-website";
import { MotionProvider } from "portfolio-website/motion-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <TooltipProvider delay={400}>{children}</TooltipProvider>
    </MotionProvider>
  );
}
