"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { staggerContainer, staggerItem } from "../../lib/motion";

type StaggerListProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul";
};

export function StaggerList({
  children,
  className,
  as = "div",
}: StaggerListProps) {
  const items = Array.isArray(children) ? children : [children];

  if (as === "ul") {
    return (
      <motion.ul
        className={className}
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {items.map((child, index) => (
          <motion.li key={index} variants={staggerItem}>
            {child}
          </motion.li>
        ))}
      </motion.ul>
    );
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {items.map((child, index) => (
        <motion.div key={index} variants={staggerItem}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export { staggerItem as staggerItemVariants };
