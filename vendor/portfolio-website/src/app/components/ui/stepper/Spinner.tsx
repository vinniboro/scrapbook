"use client";

import type { CSSProperties } from "react";
import styles from "./Spinner.module.css";

export function StepperSpinner({
  color,
  size = 24,
}: {
  color: string;
  size?: number;
}) {
  const triplet = color.startsWith("rgb")
    ? color.slice(4, -1)
    : color;
  return (
    <span
      className={styles.spinner}
      style={
        {
          width: size,
          height: size,
          "--spinner-color": triplet,
        } as CSSProperties
      }
      aria-hidden
    >
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className={styles.bar} />
      ))}
    </span>
  );
}
