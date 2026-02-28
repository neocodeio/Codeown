/** Maximum allowed image file size in bytes (1MB) */
export const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;

/** Maximum allowed image file size in MB (for display) */
export const MAX_IMAGE_SIZE_MB = 1;

/**
 * Validates that a file does not exceed the 1MB limit.
 * @param file - The file to validate
 * @returns Error message if invalid, null if valid
 */
export function validateImageSize(file: File): string | null {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    return `Image size must not exceed ${MAX_IMAGE_SIZE_MB}MB. Your file is ${sizeMB}MB. Please choose a smaller image.`;
  }
  return null;
}
