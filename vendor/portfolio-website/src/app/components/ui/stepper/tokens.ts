export const STEPPER_EASING = {
  easeOutQuad: [0.25, 0.46, 0.45, 0.94],
  easeOutCubic: [0.215, 0.61, 0.355, 1],
  easeOutQuart: [0.165, 0.84, 0.44, 1],
  easeOutQuint: [0.23, 1, 0.32, 1],
  easeInOutQuart: [0.77, 0, 0.175, 1],
} as const;

export const STEP_SLIDE_VARIANTS = {
  enter: (direction: number) => ({
    x: direction > 0 ? "110%" : "-110%",
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? "110%" : "-110%",
    opacity: 0,
  }),
};

export const CARD_COLORS = [
  "248, 117, 39",
  "38, 139, 210",
  "220, 50, 47",
  "133, 153, 0",
  "181, 137, 0",
  "211, 54, 130",
  "108, 113, 196",
  "42, 161, 152",
  "88, 110, 117",
  "7, 54, 66",
] as const;

export function getCardTextColor(color: string) {
  if (color === "181, 137, 0" || color === "42, 161, 152") {
    return "rgb(7, 54, 66)";
  }
  return "rgb(253, 246, 227)";
}

export function getSpinnerColor(cardColor: string) {
  if (cardColor === "181, 137, 0" || cardColor === "42, 161, 152") {
    return "7, 54, 66";
  }
  return "253, 246, 227";
}
