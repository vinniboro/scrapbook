export const spring = {
  fast: { type: "spring" as const, duration: 0.22, bounce: 0 },
  base: { type: "spring" as const, duration: 0.35, bounce: 0 },
  page: { type: "spring" as const, duration: 0.38, bounce: 0 },
  gentle: { type: "spring" as const, duration: 0.6, bounce: 0 },
};

export const ease = {
  outQuint: [0.23, 1, 0.32, 1] as const,
  outQuad: [0.25, 0.46, 0.45, 0.94] as const,
  standard: [0.4, 0, 0.2, 1] as const,
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: spring.base,
  },
};
