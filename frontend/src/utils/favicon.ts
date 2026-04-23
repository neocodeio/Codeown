/**
 * Utility to manage the browser tab icon (favicon)
 * Specifically to add/remove a notification red dot.
 */

let originalIconUrl = "/icon.png";
let currentHasDot = false;

/**
 * Adds a red dot to the favicon
 */
export const setFaviconDot = (hasDot: boolean) => {
    if (hasDot === currentHasDot) return;
    currentHasDot = hasDot;

    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) return;

    if (!hasDot) {
        link.href = originalIconUrl;
        return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = originalIconUrl;
    img.crossOrigin = "anonymous";
    img.onload = () => {
        // Draw original icon
        ctx.clearRect(0, 0, 32, 32);
        ctx.drawImage(img, 0, 0, 32, 32);

        // Draw red dot
        const radius = 7;
        const x = 32 - radius;
        const y = radius;

        // Outer glow/border for the dot
        ctx.beginPath();
        ctx.arc(x, y, radius + 2, 0, 2 * Math.PI);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();

        // The dot itself
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#FF0000";
        ctx.fill();

        link.href = canvas.toDataURL("image/png");
    };
};

/**
 * Initialize the original icon URL from the DOM
 */
export const initFavicon = () => {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link) {
        originalIconUrl = link.href;
    }
};
