import { HugeiconsIcon } from "@hugeicons/react";
import { FireIcon } from "@hugeicons/core-free-icons";
import flameGif from "../assets/flame.gif";

interface StreakBadgeProps {
    count: number;
}

export default function StreakBadge({ count }: StreakBadgeProps) {
    const isActive = count > 0;

    return (
        <div
            className="streak-badge"
            style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "1px 10px 1px 6px",
                backgroundColor: isActive ? "rgba(255, 126, 0, 0.1)" : "rgba(148, 163, 184, 0.1)",
                borderRadius: "20px",
                border: isActive ? "1px solid rgba(255, 126, 0, 0.2)" : "1px solid rgba(148, 163, 184, 0.2)",
                transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                cursor: "pointer",
                userSelect: "none",
                minHeight: "26px"
            }}
        >
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
                position: "relative"
            }}>
                {isActive ? (
                    <img
                        src={flameGif}
                        alt="Streak active"
                        style={{
                            width: "24px",
                            height: "24px",
                            marginTop: "-1px"
                        }}
                    />
                ) : (
                    <HugeiconsIcon
                        icon={FireIcon}
                        style={{
                            fontSize: "14px",
                            color: "#94a3b8"
                        }}
                    />
                )}
            </div>
            <span style={{
                fontSize: "13px",
                fontWeight: 800,
                color: isActive ? "#ff7e00" : "#94a3b8",
                fontFamily: "'Outfit', sans-serif"
            }}>
                {count}
            </span>

            <style>{`
        @keyframes streak-bounce {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0px transparent); }
          50% { transform: scale(1.15) translateY(-1px); filter: drop-shadow(0 0 8px rgba(255, 126, 0, 0.4)); }
        }
        .streak-badge:hover {
          transform: scale(1.05);
          background-color: rgba(255, 126, 0, 0.15);
          box-shadow: 0 4px 12px rgba(255, 126, 0, 0.1);
        }
      `}</style>
        </div>
    );
}
