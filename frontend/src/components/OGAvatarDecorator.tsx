import React from "react";

interface OGAvatarDecoratorProps {
    children: React.ReactNode;
    isOG?: boolean;
}

export default function OGAvatarDecorator({ children, isOG = false }: OGAvatarDecoratorProps) {
    if (!isOG) return <>{children}</>;

    return (
        <div style={{ position: "relative", display: "inline-flex", padding: "4px" }}>
            {/* The OG Tech Brackets - Minimalist high-tech feel */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 0,
                pointerEvents: "none"
            }}>
                {/* 4 corner bracket points around the square avatar */}
                <div style={{ position: "absolute", top: 0, left: 0, width: "10px", height: "10px", borderTop: "2px solid var(--text-primary)", borderLeft: "2px solid var(--text-primary)", borderRadius: "1px" }} />
                <div style={{ position: "absolute", top: 0, right: 0, width: "10px", height: "10px", borderTop: "2px solid var(--text-primary)", borderRight: "2px solid var(--text-primary)", borderRadius: "1px" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, width: "10px", height: "10px", borderBottom: "2px solid var(--text-primary)", borderLeft: "2px solid var(--text-primary)", borderRadius: "1px" }} />
                <div style={{ position: "absolute", bottom: 0, right: 0, width: "10px", height: "10px", borderBottom: "2px solid var(--text-primary)", borderRight: "2px solid var(--text-primary)", borderRadius: "1px" }} />
            </div>

            {/* Glowing Aura (Slow breathing white pulse for a 'Founder' feel) */}
            <div style={{
                position: "absolute",
                top: "4px",
                left: "4px",
                right: "4px",
                bottom: "4px",
                boxShadow: "0 0 20px rgba(255, 255, 255, 0.25)",
                borderRadius: "var(--radius-xs)",
                zIndex: 0,
                animation: "ogPulse 4s ease-in-out infinite"
            }} />

            <style>{`
                @keyframes ogPulse {
                    0% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                    100% { opacity: 0.2; transform: scale(1); }
                }
            `}</style>

            {/* The Avatar Itself */}
            <div style={{ position: "relative", zIndex: 1 }}>
                {children}
            </div>

            {/* Small 'FOUNDING 100' tag for extra exclusivity */}
            <div style={{
                position: "absolute",
                bottom: "-6px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "var(--text-primary)",
                color: "var(--bg-page)",
                fontSize: "7.5px",
                fontWeight: 900,
                padding: "2px 6px",
                borderRadius: "1px",
                fontFamily: "var(--font-mono)",
                zIndex: 10,
                border: "1px solid var(--bg-page)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap"
            }}>
                OG 100
            </div>
        </div>
    );
}
