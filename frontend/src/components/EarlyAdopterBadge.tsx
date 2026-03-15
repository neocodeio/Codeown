import { useState } from 'react';
import { Rocket } from "phosphor-react";

interface EarlyAdopterBadgeProps {
    isEarlyAdopter?: boolean;
    size?: string;
}

export default function EarlyAdopterBadge({ isEarlyAdopter, size = "14px" }: EarlyAdopterBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    if (!isEarlyAdopter) return null;

    return (
        <div
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                cursor: "pointer",
                marginLeft: "4px"
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <Rocket
                size={size}
                weight="fill"
                aria-label="Early Adopter"
                style={{
                    color: "var(--text-primary)",
                    verticalAlign: "middle",
                    flexShrink: 0,
                    opacity: 0.8
                }}
            />

            {showTooltip && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "100%",
                        left: "50%",
                        transform: "translateX(-50%) translateY(-12px)",
                        backgroundColor: "var(--bg-page)",
                        color: "var(--text-primary)",
                        padding: "6px 10px",
                        border: "0.5px solid var(--border-hairline)",
                        borderRadius: "2px",
                        fontSize: "10px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        zIndex: 1000,
                        pointerEvents: "none",
                        animation: "tooltipFadeIn 0.15s ease",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                    }}
                >
                    <style>{`
                        @keyframes tooltipFadeIn {
                            from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
                            to { opacity: 1; transform: translateX(-50%) translateY(-8px); }
                        }
                    `}</style>
                    Early Adopter_#001
                    <div style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "0",
                        height: "0",
                        borderLeft: "4px solid transparent",
                        borderRight: "4px solid transparent",
                        borderTop: "4px solid var(--border-hairline)",
                    }} />
                </div>
            )}
        </div>
    );
}
