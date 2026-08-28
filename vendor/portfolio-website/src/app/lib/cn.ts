type ClassName = string | false | null | undefined;

export function cn(...classes: ClassName[]): string {
  return classes.filter(Boolean).join(" ");
}

export function mergeClass<T>(
  className: string | ((state: T) => string | undefined) | undefined,
  ...base: ClassName[]
): string | ((state: T) => string) {
  if (typeof className === "function") {
    return (state: T) => cn(...base, className(state));
  }
  return cn(...base, className);
}
