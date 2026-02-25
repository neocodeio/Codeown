/**
 * Simple image compression utility using Canvas API
 * Fallback for when browser-image-compression has issues
 */

export interface CompressionOptions {
    maxSizeKB?: number;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
}

/**
 * Compress an image using Canvas API
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<File> - Compressed file
 */
export async function compressImageSimple(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const {
        maxSizeKB = 200,
        maxWidth = 1280,
        maxHeight = 1280,
        quality = 0.8
    } = options;

    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }

        const img = new Image();
        img.onload = () => {
            try {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }

                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            
                            // Check if compression achieved target size
                            if (compressedFile.size <= maxSizeKB * 1024) {
                                console.log(`Compressed from ${(file.size / 1024).toFixed(2)}KB to ${(compressedFile.size / 1024).toFixed(2)}KB`);
                            } else {
                                console.log(`Compressed to ${(compressedFile.size / 1024).toFixed(2)}KB (target: ${maxSizeKB}KB)`);
                            }
                            
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Canvas compression failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => {
            reject(new Error('Image loading failed'));
        };
        
        // Load image
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Check if image needs compression
 * @param file - The image file to check
 * @param maxSizeKB - Maximum size in KB
 * @returns boolean - Whether compression is needed
 */
export function needsCompression(file: File, maxSizeKB: number = 200): boolean {
    return file.size > maxSizeKB * 1024;
}
