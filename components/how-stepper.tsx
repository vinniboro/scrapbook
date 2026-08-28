"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button, spring } from "@/components/ui";
import { walkthrough } from "@/content/manifesto";
import { DESKTOP_MQ } from "@/lib/device";

export function HowStepper() {
  const [step, setStep] = useState(0);
  const reduce = useReducedMotion();
  const router = useRouter();
  const panel = walkthrough[step];
  const last = step === walkthrough.length - 1;

  async function finish() {
    await fetch("/api/how", { method: "POST" });
    const isDesktop = window.matchMedia(DESKTOP_MQ).matches;
    router.replace(isDesktop ? "/today" : "/me");
    router.refresh();
  }

  return (
    <div className="flex min-h-[60vh] flex-col justify-center gap-8">
      <p className="text-caption opacity-50">
        {step + 1} / {walkthrough.length}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={panel.title}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={spring.base}
          className="flex flex-col gap-8"
        >
          <h1 className="type-display">{panel.title}</h1>
          <p className="type-essay">{panel.body}</p>
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-3">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep((value) => value - 1)}>
            Back
          </Button>
        ) : null}
        <Button onClick={() => (last ? finish() : setStep((value) => value + 1))}>
          {last ? "Enter" : "Next"}
        </Button>
      </div>
    </div>
  );
}
