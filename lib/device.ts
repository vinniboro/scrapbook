export function isPhone(userAgent: string | null) {
  if (!userAgent) return false;
  return /Android|iPhone|iPod|Mobile/i.test(userAgent);
}
