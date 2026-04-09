/** Maximum allowed image file size in bytes (1MB) */
export const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;
export const MAX_IMAGE_SIZE_MB = 1;

/** Maximum allowed general file size in bytes (10MB) */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = 10;

/**
 * Validates that an image file does not exceed the limit.
 */
export function validateImageSize(file: File): string | null {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    return `Image size must not exceed ${MAX_IMAGE_SIZE_MB}MB. Your file is ${sizeMB}MB.`;
  }
  return null;
}

/**
 * Validates that a general file does not exceed the limit.
 */
export function validateFileSize(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    return `File size must not exceed ${MAX_FILE_SIZE_MB}MB. Your file is ${sizeMB}MB.`;
  }
  return null;
}
