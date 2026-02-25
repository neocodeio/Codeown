/**
 * Compresses an image file or base64 string using Canvas API
 * @param source File or base64 string
 * @param maxWidth Maximum width in pixels
 * @param maxHeight Maximum height in pixels
 * @param quality Compression quality (0 to 1)
 * @returns Promise that resolves to a compressed base64 string
 */
export const compressImage = async (
    source: File | string,
    maxWidth: number = 1200,
    maxHeight: number = 1200,
    quality: number = 0.7
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions while maintaining aspect ratio
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Failed to get canvas context"));
                return;
            }

            // Use a background for transparency cases (optional, but good for consistency)
            // ctx.fillStyle = "#FFFFFF";
            // ctx.fillRect(0, 0, width, height);

            ctx.drawImage(img, 0, 0, width, height);

            // Export as JPEG for better compression
            const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
            resolve(compressedBase64);
        };

        img.onerror = (err) => {
            reject(err);
        };

        if (source instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(source);
        } else {
            img.src = source;
        }
    });
};

/**
 * Utility to convert compressed base64 back to a File object if needed
 */
export const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

/**
 * Gets image URL with CORS-safe handling and fallback
 * @param url Original Supabase URL
 * @returns Direct Supabase URL with proper CORS handling
 */
export const getOptimizedImageUrl = (url: string) => {
    if (!url || typeof url !== 'string') return url;

    // Return Supabase URLs as-is - they should work with proper bucket configuration
    // The CORS issue should be fixed at the Supabase bucket level
    return url;
};

/**
 * Handles image loading errors and provides fallback
 * @param img HTMLImageElement
 * @param fallbackUrl Fallback URL or placeholder
 */
export const handleImageError = (img: HTMLImageElement, fallbackUrl?: string) => {
    if (img.src.includes('supabase.co/storage/v1/object/public/')) {
        // If Supabase image fails, try adding a timestamp to bypass cache
        const timestampedUrl = img.src.includes('?') 
            ? `${img.src}&_t=${Date.now()}`
            : `${img.src}?_t=${Date.now()}`;
        
        // Try once more with timestamp
        if (!img.src.includes('_t=')) {
            img.src = timestampedUrl;
            return;
        }
    }
    
    // Final fallback to placeholder or default
    img.src = fallbackUrl || `https://ui-avatars.com/api/?name=Project&background=212121&color=ffffff&bold=true&size=400`;
};
