import { memo } from "react";
import { useTheme } from "../context/ThemeContext";

interface OGAvatarDecoratorProps {
    children: React.ReactNode;
    is_og?: boolean;
}

const OGAvatarDecorator = memo(({ children, is_og = false }: OGAvatarDecoratorProps) => {
    const { theme } = useTheme();

    // Support both boolean and string "true" from DB
    const isActuallyOG = is_og === true || String(is_og) === "true";

    if (!isActuallyOG) return <>{children}</>;

    // const glowColor = theme === "dark" 
    //     ? "rgba(255, 255, 255, 0.45)" 
    //     : "rgba(0, 0, 0, 0.2)";
    const ringColor = "var(--text-primary)";
    const shimmerPrimary = theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.1)";

    return (
        <div style={{
            position: "relative",
            display: "inline-block",
            lineHeight: 0,
            width: "max-content",
            height: "max-content",
            padding: "3px", // Distinct separation
            zIndex: 1
        }}>
            {/* The "Founding Ring" - Clean 1px primary border with high-end glow */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                border: `1px solid #e0e0e0`,
                borderRadius: "var(--radius-xs)",
                // boxShadow: `0 0 15px ${glowColor}, inset 0 0 5px ${shimmerPrimary}`, 
                pointerEvents: "none",
                zIndex: 0,
                overflow: "hidden"
            }}>
                <div style={{
                    position: "absolute",
                    width: "300%",
                    height: "300%",
                    top: "-100%",
                    left: "-100%",
                    background: `conic-gradient(from 0deg, transparent 0%, ${shimmerPrimary} 15%, transparent 30%, ${shimmerPrimary} 50%, transparent 65%, ${shimmerPrimary} 85%, transparent 100%)`,
                    animation: "ogRotate 4s linear infinite",
                    opacity: 0.8
                }} />

                {/* Floating "Diamond Sparkles" for extra flair */}
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            width: "2px",
                            height: "2px",
                            backgroundColor: "#fff",
                            borderRadius: "var(--radius-sm)",
                            top: "50%",
                            left: "50%",
                            boxShadow: "0 0 5px #fff",
                            animation: `ogSparkle ${3 + i}s linear infinite`,
                            animationDelay: `${i * 1.5}s`,
                            opacity: 0.8,
                            zIndex: 1
                        }}
                    />
                ))}
            </div>

            {/* The Avatar Itself */}
            <div style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                {children}
            </div>

            {/* Ultra-Minimalist OG Tag - Integrated into the border flow */}
            <div style={{
                position: "absolute",
                bottom: "-6px",
                right: "-1px",
                backgroundColor: ringColor,
                color: "var(--bg-page)",
                fontSize: "8px",
                fontWeight: 800,
                padding: "4px 2px",
                borderRadius: "var(--radius-xs)",
                zIndex: 10,
                border: "1px solid #000",
                boxShadow: "0 2px 5px rgba(0,0,0,0.4)",
            }}>
                OG
            </div>
        </div>
    );
});

export default OGAvatarDecorator;
