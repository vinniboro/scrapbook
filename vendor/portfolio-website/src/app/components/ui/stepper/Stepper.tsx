"use client";

import type { FormEvent, ReactNode } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { cn } from "../../../lib/cn";
import { StepperSpinner } from "./Spinner";
import {
  getCardTextColor,
  getSpinnerColor,
  STEPPER_EASING,
  STEP_SLIDE_VARIANTS,
} from "./tokens";
import { usePaneMeasure } from "./usePaneMeasure";
import styles from "./Stepper.module.css";

export type StepperButtonState = "idle" | "loading" | "success";

export function Stepper({
  steps,
  step,
  direction,
  children,
  onBack,
  onNext,
  primaryDisabled = false,
  primaryColor = "248, 117, 39",
  buttonState = "idle",
  lastStepLabel = "Register",
  nextLabel = "Next",
  error,
  success,
  embedded = false,
}: {
  steps: string[];
  step: number;
  direction: number;
  children: ReactNode;
  onBack: () => void;
  onNext: () => void;
  primaryDisabled?: boolean;
  primaryColor?: string;
  buttonState?: StepperButtonState;
  lastStepLabel?: string;
  nextLabel?: string;
  error?: string | null;
  success?: string | null;
  embedded?: boolean;
}) {
  const [paneRef, bounds] = usePaneMeasure<HTMLDivElement>();
  const isLast = step >= steps.length - 1;
  const idleLabel = isLast ? lastStepLabel : nextLabel;
  const textColor = getCardTextColor(primaryColor);
  const spinnerRgb = getSpinnerColor(primaryColor);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (primaryDisabled || buttonState === "loading") return;
    onNext();
  };

  return (
    <MotionConfig
      transition={{ duration: 0.5, ease: STEPPER_EASING.easeOutQuart }}
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 overflow-hidden",
          embedded ? "relative w-full" : "fixed inset-0",
        )}
      >
        <form
          className={cn(
            styles.root,
            styles.card,
            styles["reaveal-effect"],
            "reaveal-effect card m-8 flex w-full max-w-sm flex-col gap-4",
          )}
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-2">
            <p className="text-sm opacity-70">
              Step {step + 1} of {steps.length}
            </p>
            <h2 className="w-full text-2xl">{steps[step]}</h2>
          </div>

          <motion.div
            className="relative overflow-hidden"
            animate={{
              height: bounds.height > 0 ? bounds.height : "auto",
              transition: {
                duration: 0.3,
                ease: STEPPER_EASING.easeInOutQuart,
              },
            }}
          >
            <div ref={paneRef}>
              <AnimatePresence
                mode="popLayout"
                initial={false}
                custom={direction}
              >
                <motion.div
                  key={step}
                  className="w-full"
                  custom={direction}
                  variants={STEP_SLIDE_VARIANTS}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          <div className="flex flex-col">
            {error ? (
              <h5 className="text-sm text-red-500" role="alert">
                {error}
              </h5>
            ) : null}
            {success ? (
              <h5 className="text-sm text-green-500" role="alert">
                {success}
              </h5>
            ) : null}
          </div>

          <div className="flex flex-row justify-end gap-2">
            <button type="button" data-variant="secondary" onClick={onBack}>
              {step === 0 ? "Back" : "Previous"}
            </button>
            <button
              data-variant="primary"
              type="submit"
              disabled={primaryDisabled || buttonState === "loading"}
              style={{
                backgroundColor: `rgb(${primaryColor})`,
                color: textColor,
              }}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={buttonState}
                  className="inline-flex items-center justify-center gap-2"
                  transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                  initial={{ y: -25, opacity: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 25 }}
                >
                  {buttonState === "loading" ? (
                    <StepperSpinner color={spinnerRgb} size={24} />
                  ) : buttonState === "success" ? (
                    "Success"
                  ) : (
                    idleLabel
                  )}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </form>
      </div>
    </MotionConfig>
  );
}
