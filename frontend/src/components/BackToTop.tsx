import { useState, useEffect } from "react";
import { ArrowUp } from "phosphor-react";
import { useWindowSize } from "../hooks/useWindowSize";

/**
 * BackToTop - A premium, minimalist floating button to return to the top of the page.
 * Features:
 * - High-end Glassmorphism effect.
 * - Responsive: Hidden on mobile screens (< 1100px).
 * - Animated transition for appearance and hover.
 */
export default function BackToTop() {
    const [isVisible, setIsVisible] = useState(false);
    const { width } = useWindowSize();
    const isMobile = width < 1100;

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 500) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    // Don't show on mobile as requested
    if (isMobile) return null;

    return (
        <div 
            onClick={scrollToTop}
            style={{
                position: "fixed",
                bottom: "110px", // Moved up to avoid overlap with existing bottom-right buttons
                right: "32px",
                width: "48px",
                height: "48px",
                backgroundColor: "var(--bg-page)",
                border: "0.5px solid var(--border-hairline)",
                borderRadius: "2px", // Sharp, modern look to match branding
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 1000,
                opacity: isVisible ? 1 : 0,
                visibility: isVisible ? "visible" : "hidden",
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                backdropFilter: "blur(4px)"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                e.currentTarget.style.borderColor = "var(--text-primary)";
                e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-page)";
                e.currentTarget.style.borderColor = "var(--border-hairline)";
                e.currentTarget.style.transform = "translateY(0)";
            }}
            title="Back to Top"
        >
            <ArrowUp size={20} weight="thin" color="var(--text-primary)" />
        </div>
    );
}
