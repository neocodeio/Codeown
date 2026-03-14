import { Fire } from "phosphor-react";
import flameGif from "../assets/flame.gif";

interface StreakBadgeProps {
    count: number;
    mini?: boolean;
}

export default function StreakBadge({ count, mini }: StreakBadgeProps) {
    const isActive = count > 0;

    return (
        <div
            className="streak-badge"
            style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                backgroundColor: "transparent",
                borderRadius: "var(--radius-xs)",
                border: "0.5px solid var(--border-hairline)",
                transition: "all 0.15s ease",
                cursor: "pointer",
                userSelect: "none",
                minHeight: "22px"
            }}
        >
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: mini ? "14px" : "20px",
                height: mini ? "14px" : "20px",
                position: "relative"
            }}>
                {isActive ? (
                    <img
                        src={flameGif}
                        alt="Streak active"
                        style={{
                            width: "14px",
                            height: "14px",
                            filter: "grayscale(1) contrast(1.2)"
                        }}
                    />
                ) : (
                    <Fire
                        size={12}
                        weight="thin"
                        style={{
                            color: "var(--text-tertiary)"
                        }}
                    />
                )}
            </div>
            <span style={{
                fontSize: "11px",
                fontWeight: 800,
                color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                fontFamily: "var(--font-mono)"
            }}>
                {count.toString().padStart(2, '0')}
            </span>

            <style>{`
        .streak-badge:hover {
          border-color: var(--text-primary);
          background-color: var(--bg-hover);
        }
      `}</style>
        </div>
    );
}
