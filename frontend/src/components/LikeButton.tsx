import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon } from "@hugeicons/core-free-icons";
import RollingNumber from "./RollingNumber";

interface LikeButtonProps {
    isLiked: boolean;
    likeCount: number;
    onToggle: (e: React.MouseEvent) => void;
    disabled?: boolean;
}

export default function LikeButton({ isLiked, likeCount, onToggle, disabled }: LikeButtonProps) {
    const [showBurst, setShowBurst] = useState(false);

    useEffect(() => {
        if (isLiked) {
            setShowBurst(true);
            const timer = setTimeout(() => setShowBurst(false), 800);
            return () => clearTimeout(timer);
        }
    }, [isLiked]);

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", position: "relative" }}>
            <style>{`
        @keyframes heartPop {
          0% { transform: scale(1); }
          25% { transform: scale(1.2); }
          50% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes particleExplode {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tw-tx), var(--tw-ty)) scale(0); opacity: 0; }
        }
        .heart-pop {
          animation: heartPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: #ef4444;
          pointer-events: none;
          z-index: 10;
        }
      `}</style>

            <button
                onClick={onToggle}
                disabled={disabled}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    border: "none",
                    padding: "4px",
                    cursor: "pointer",
                    color: isLiked ? "#ef4444" : "var(--text-tertiary)",
                    transition: "all 0.2s ease",
                    position: "relative",
                    borderRadius: "50%",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                    e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    if (!isLiked) e.currentTarget.style.color = "var(--text-tertiary)";
                }}
            >
                <div className={isLiked ? "heart-pop" : ""}>
                    <HugeiconsIcon
                        icon={FavouriteIcon}
                        size={20}
                        className={isLiked ? "hugeicon-filled" : ""}
                    />
                </div>

                {showBurst && (
                    <>
                        {[...Array(8)].map((_, i) => {
                            const angle = (i / 8) * Math.PI * 2;
                            const dist = 24;
                            const tx = Math.cos(angle) * dist;
                            const ty = Math.sin(angle) * dist;
                            return (
                                <div
                                    key={i}
                                    className="particle"
                                    style={{
                                        left: "50%",
                                        top: "50%",
                                        marginTop: "-2px",
                                        marginLeft: "-2px",
                                        // @ts-ignore
                                        "--tw-tx": `${tx}px`,
                                        "--tw-ty": `${ty}px`,
                                        animation: `particleExplode 0.6s ease-out forwards`,
                                        backgroundColor: i % 2 === 0 ? "#ef4444" : "#f87171"
                                    }}
                                />
                            );
                        })}
                    </>
                )}
            </button>

            <RollingNumber value={likeCount} color={isLiked ? "#ef4444" : "var(--text-tertiary)"} fontWeight={700} fontSize="12px" />
        </div>
    );
}
