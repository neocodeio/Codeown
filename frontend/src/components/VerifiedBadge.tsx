import { useState } from 'react';
import { CircleWavyCheck } from "phosphor-react";

interface VerifiedBadgeProps {
    username?: string | null;
    isPro?: boolean;
    size?: string;
    color?: string;
}

export default function VerifiedBadge({ username, isPro, size = "14px", color }: VerifiedBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const isVerified = username?.toLowerCase() === "amin.ceo";

    if (isVerified) {
        return (
            <div
                style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    cursor: "pointer"
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <CircleWavyCheck
                    size={size}
                    weight="fill"
                    aria-label="Verified Official Account"
                    style={{
                        color: color ? color : (isPro ? "var(--text-primary)" : "var(--text-tertiary)"),
                        marginLeft: "0px",
                        marginRight: "4.5px",
                        verticalAlign: "middle",
                        flexShrink: 0,
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
                            borderRadius: "var(--radius-sm)",
                            fontSize: "11px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            zIndex: 1000,
                            pointerEvents: "none",
                            animation: "tooltipFadeIn 0.15s ease",
                        }}
                    >
                        <style>{`
                            @keyframes tooltipFadeIn {
                                from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
                                to { opacity: 1; transform: translateX(-50%) translateY(-8px); }
                            }
                        `}</style>
                        Verified Official Account
                        {/* Tooltip Arrow */}
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
    return null;
}
