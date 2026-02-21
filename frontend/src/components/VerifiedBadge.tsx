import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

interface VerifiedBadgeProps {
    username?: string | null;
    size?: string;
}

export default function VerifiedBadge({ username, size = "14px" }: VerifiedBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    if (username?.toLowerCase() === "amin.ceo") {
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
                <FontAwesomeIcon
                    icon={faCheckCircle}
                    aria-label="Verified Official Account"
                    style={{
                        fontSize: size,
                        color: "#2B7FFF", // High-visibility premium blue
                        marginLeft: "6px",
                        verticalAlign: "middle",
                        flexShrink: 0,
                        transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                        transform: showTooltip ? "scale(1.15)" : "scale(1)"
                    }}
                />

                {showTooltip && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: "100%",
                            left: "50%",
                            transform: "translateX(-50%) translateY(-8px)",
                            backgroundColor: "#0f172a",
                            color: "#fff",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                            zIndex: 1000,
                            pointerEvents: "none",
                            animation: "tooltipFadeIn 0.2s ease"
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
                            borderLeft: "5px solid transparent",
                            borderRight: "5px solid transparent",
                            borderTop: "5px solid #0f172a",
                        }} />
                    </div>
                )}
            </div>
        );
    }
    return null;
}
