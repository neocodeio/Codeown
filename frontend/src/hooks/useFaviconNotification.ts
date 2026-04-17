import { useEffect } from 'react';

export const useFaviconNotification = (unreadCount: number, baseIconUrl?: string) => {
    useEffect(() => {
        const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        const appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;

        // Try to get the original icon from the document if we haven't already replaced it with a data URL
        const currentFavicon = faviconLink?.href || '';
        const originalFavicon = baseIconUrl || ((!currentFavicon.startsWith('data:') && currentFavicon)
            ? currentFavicon
            : '/icon.png'); // Use /icon.png as default to match index.html

        // If no notifications, reset to original and stop
        if (unreadCount <= 0) {
            const links = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
            links.forEach(link => {
                const hlink = link as HTMLLinkElement;
                if (hlink.href !== originalFavicon) {
                    // To force browser refresh, we sometimes need to remove and re-append
                    const parent = hlink.parentNode;
                    const next = hlink.nextSibling;
                    if (parent) {
                        parent.removeChild(hlink);
                        hlink.href = originalFavicon;
                        parent.insertBefore(hlink, next);
                    } else {
                        hlink.href = originalFavicon;
                    }
                }
            });
            return;
        }

        const faviconSize = 64;
        const canvas = document.createElement('canvas');
        canvas.width = faviconSize;
        canvas.height = faviconSize;
        const context = canvas.getContext('2d');
        const image = new Image();

        image.crossOrigin = 'anonymous';
        image.onload = () => {
            if (!context) return;

            context.clearRect(0, 0, faviconSize, faviconSize);
            context.drawImage(image, 0, 0, faviconSize, faviconSize);

            const dotRadius = faviconSize * 0.22;
            const centerX = faviconSize - dotRadius;
            const centerY = dotRadius;

            context.shadowColor = 'rgba(0, 0, 0, 0.4)';
            context.shadowBlur = 4;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 1;

            context.beginPath();
            context.arc(centerX, centerY, dotRadius, 0, 2 * Math.PI, false);
            context.fillStyle = '#ef4444';
            context.fill();

            context.shadowColor = 'transparent';
            context.shadowBlur = 0;
            context.lineWidth = faviconSize * 0.08;
            context.strokeStyle = '#ffffff';
            context.stroke();

            try {
                const dataURL = canvas.toDataURL('image/png');
                const links = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
                links.forEach(link => {
                    (link as HTMLLinkElement).href = dataURL;
                });
                if (appleIcon) appleIcon.href = dataURL;
            } catch (e) {
                console.error("Failed to update favicon:", e);
            }
        };

        image.onerror = () => {
            // Fallback to a simpler dot if the image fails to load
            if (!context) return;
            context.clearRect(0, 0, faviconSize, faviconSize);
            context.beginPath();
            context.arc(faviconSize - 15, 15, 12, 0, 2 * Math.PI);
            context.fillStyle = '#ef4444';
            context.fill();
            const dataURL = canvas.toDataURL('image/png');
            if (faviconLink) faviconLink.href = dataURL;
        };

        image.src = originalFavicon;
    }, [unreadCount]);
};
