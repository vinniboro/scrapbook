export const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;
export const PANEL_ANIMATION_DURATION = 0.2;
export const SPRING_DURATION = 0.3;
export const ICON_ANIMATION_DURATION = 0.15;

export const ICON_VARIANTS = {
  hidden: { opacity: 0, scale: 0.95, y: -5 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

export const BLUR_SWAP = {
  hidden: { opacity: 0, filter: "blur(10px)" },
  visible: { opacity: 1, filter: "blur(0px)" },
};
