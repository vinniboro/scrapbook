export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export type ImageValidationError = "unsupported" | "too_large" | "missing";

export function validateImageInput(input: {
  contentType: string;
  size: number;
}): ImageValidationError | null {
  if (!input.contentType || input.size === 0) return "missing";
  if (!ALLOWED_IMAGE_TYPES.has(input.contentType)) return "unsupported";
  if (input.size > MAX_IMAGE_BYTES) return "too_large";
  return null;
}

export function validateImageFile(file: File): ImageValidationError | null {
  return validateImageInput({
    contentType: file.type || "application/octet-stream",
    size: file.size,
  });
}
