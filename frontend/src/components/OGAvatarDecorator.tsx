import { memo } from "react";

interface OGAvatarDecoratorProps {
    children: React.ReactNode;
    is_og?: boolean;
    size?: number;
}

const OGAvatarDecorator = memo(({ children, is_og = false, size = 40 }: OGAvatarDecoratorProps) => {
    const isActuallyOG = is_og === true || String(is_og) === "true";

    if (!isActuallyOG) return <>{children}</>;

    // Professional scaling constants
    const tagFontSize = Math.max(8, Math.floor(size * 0.16));
    const tagPaddingX = Math.max(4, Math.floor(size * 0.12));
    const tagPaddingY = Math.max(2, Math.floor(size * 0.05));
    const tagRadius = "99px"; // High-end pill shape

    return (
        <div style={{
            position: "relative",
            display: "inline-flex",
            lineHeight: 0,
            padding: "2px", // Space for the pulse ring
        }}>
            <style>{`
                @keyframes ogPulse {
                    0% { transform: scale(0.95); opacity: 0.15; }
                    50% { transform: scale(1.1); opacity: 0.45; }
                    100% { transform: scale(1.2); opacity: 0; }
                }
                @keyframes ogShimmer {
                    0% { transform: translateX(-150%) skewX(-25deg); }
                    20% { transform: translateX(150%) skewX(-25deg); }
                    100% { transform: translateX(150%) skewX(-25deg); }
                }
            `}</style>

            {/* Luminous Outer Pulse Ring */}
            <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: "50%",
                border: "1.5px solid var(--text-primary)",
                animation: "ogPulse 3s infinite ease-out",
                pointerEvents: "none",
                zIndex: 0
            }} />

            {/* The Avatar Container */}
            <div style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                border: "1px solid var(--text-primary)",
                overflow: "hidden",
                width: size,
                height: size,
                boxSizing: "border-box",
                zIndex: 1,
                backgroundColor: "var(--bg-page)"
            }}>
                {children}

                {/* Liquid Gold Shine Overlay */}
                <div style={{
                    position: "absolute",
                    top: 0, left: 0, width: "100%", height: "100%",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                    animation: "ogShimmer 4s infinite linear",
                    pointerEvents: "none",
                    zIndex: 2,
                }} />
            </div>

            {/* Premium OG Pill - High-Contrast Gradient */}
            <div style={{
                position: "absolute",
                top: `-2px`,
                right: `-2px`,
                background: "linear-gradient(135deg, var(--text-primary) 0%, #444 100%)",
                color: "var(--bg-page)",
                fontSize: `${tagFontSize}px`,
                fontWeight: 900,
                padding: `${tagPaddingY}px ${tagPaddingX}px`,
                borderRadius: tagRadius,
                boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: "1",
                letterSpacing: "0.06em",
                pointerEvents: "none",
                border: "0.5px solid rgba(255,255,255,0.1)"
            }}>
                OG
            </div>
        </div>
    );
});

export default OGAvatarDecorator;
