import { useEffect } from 'react';

export const useFaviconNotification = (unreadCount: number) => {
    useEffect(() => {
        const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        const appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;

        // Original path - this should match the one in index.html
        const originalFavicon = '/favicon.png';

        // If no notifications, reset to original and stop
        if (unreadCount <= 0) {
            if (faviconLink) faviconLink.href = originalFavicon;
            if (appleIcon) appleIcon.href = originalFavicon;
            return;
        }

        const faviconSize = 64; // Higher resolution canvas for crisp image
        const canvas = document.createElement('canvas');
        canvas.width = faviconSize;
        canvas.height = faviconSize;
        const context = canvas.getContext('2d');
        const image = new Image();

        image.src = originalFavicon;
        image.crossOrigin = 'anonymous';

        image.onload = () => {
            if (!context) return;

            // Clear canvas
            context.clearRect(0, 0, faviconSize, faviconSize);

            // Draw the base favicon
            context.drawImage(image, 0, 0, faviconSize, faviconSize);

            // Draw the red badge dot
            const dotRadius = faviconSize * 0.22;
            const centerX = faviconSize - dotRadius;
            const centerY = dotRadius;

            // Draw shadow for depth
            context.shadowColor = 'rgba(0, 0, 0, 0.4)';
            context.shadowBlur = 4;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 1;

            context.beginPath();
            context.arc(centerX, centerY, dotRadius, 0, 2 * Math.PI, false);
            context.fillStyle = '#ef4444'; // Red-500
            context.fill();

            // Clean border for contrast
            context.shadowColor = 'transparent';
            context.shadowBlur = 0;
            context.lineWidth = faviconSize * 0.08;
            context.strokeStyle = '#ffffff';
            context.stroke();

            const dataURL = canvas.toDataURL('image/png');

            // Update all relevant favicon links
            const links = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
            links.forEach(link => {
                (link as HTMLLinkElement).href = dataURL;
            });

            // Sync with apple-touch-icon if specified
            if (appleIcon) {
                appleIcon.href = dataURL;
            }
        };
    }, [unreadCount]);
};
