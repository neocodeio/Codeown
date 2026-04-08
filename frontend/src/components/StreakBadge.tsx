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
                gap: mini ? "2px" : "4px",
                padding: mini ? "1px 6px" : "2px 10px",
                backgroundColor: isActive ? "rgba(255, 153, 0, 0.08)" : "transparent",
                borderRadius: "var(--radius-sm)",
                border: "1px solid",
                borderColor: isActive ? "rgba(255, 153, 0, 0.25)" : "var(--border-hairline)",
                transition: "all 0.15s ease",
                cursor: "pointer",
                userSelect: "none",
                minHeight: mini ? "18px" : "24px",
                backdropFilter: isActive ? "blur(4px)" : "none"
            }}
        >
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: mini ? "14px" : "18px",
                height: mini ? "14px" : "18px",
                position: "relative"
            }}>
                {isActive ? (
                    <img
                        src={flameGif}
                        alt="Streak active"
                        style={{
                            width: mini ? "13px" : "16px",
                            height: mini ? "13px" : "16px",
                            filter: "drop-shadow(0 0 4px rgba(255, 153, 0, 0.4))",
                            transform: "translateY(-0.5px)"
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
                fontSize: "12px",
                fontWeight: 800,
                color: isActive ? "#FF9900" : "var(--text-tertiary)",
                letterSpacing: "-0.01em"
            }}>
                {count}
            </span>

            <style>{`
        .streak-badge:hover {
          border-color: ${isActive ? "#FF9900" : "var(--text-primary)"} !important;
          background-color: ${isActive ? "rgba(255, 153, 0, 0.12)" : "var(--bg-hover)"} !important;
          transform: translateY(-1px);
        }
        .streak-badge:active {
          transform: translateY(0);
        }
      `}</style>
        </div>
    );
}
