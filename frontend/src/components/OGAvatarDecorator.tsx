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
    const offset = -Math.ceil(size * 0.02);

    return (
        <div style={{
            position: "relative",
            display: "inline-flex",
            padding: "1px", // Minimalist container padding
            lineHeight: 0,
        }}>
            {/* The Avatar Container with subtle sharp border */}
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
                boxSizing: "border-box"
            }}>
                {children}
            </div>

            {/* Premium OG Pill - Positioned Top-Right with Cutout effect */}
            <div style={{
                position: "absolute",
                top: `${offset}px`,
                right: `${offset}px`,
                backgroundColor: "var(--text-primary)",
                color: "var(--bg-page)",
                fontSize: `${tagFontSize}px`,
                fontWeight: 800,
                padding: `${tagPaddingY}px ${tagPaddingX}px`,
                borderRadius: tagRadius,
                boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: "1",
                letterSpacing: "0.04em",
                pointerEvents: "none",
                userSelect: "none"
            }}>
                OG
            </div>
        </div>
    );
});

export default OGAvatarDecorator;
