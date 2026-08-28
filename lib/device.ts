export function isPhone(userAgent: string | null) {
  if (!userAgent) return false;
  return /Android|iPhone|iPod|Mobile/i.test(userAgent);
}

export const DESKTOP_MQ = "(min-width: 768px)";
