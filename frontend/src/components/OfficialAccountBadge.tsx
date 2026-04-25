import { useState } from 'react';
import { CircleWavyCheck } from "phosphor-react";

interface OfficialAccountBadgeProps {
    username?: string | null;
    size?: string;
}

export default function OfficialAccountBadge({ username, size = "14px" }: OfficialAccountBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const isOfficial = username?.toLowerCase() === "codeown.official";

    if (isOfficial) {
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
                    color="#FFD700" 
                    aria-label="Official Codeown Account"
                    style={{
                        color: "#FFD700",
                        marginLeft: "2px",
                        marginRight: "2px",
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
                        Official Codeown Account
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
