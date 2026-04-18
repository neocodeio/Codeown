import React, { useState } from "react";
import { useFollow } from "../hooks/useFollow";
import { useClerkUser } from "../hooks/useClerkUser";
import { useNavigate } from "react-router-dom";

interface InlineFollowButtonProps {
    userId: string;
    onFollowChange?: (isFollowing: boolean) => void;
}

export default function InlineFollowButton({ userId, onFollowChange }: InlineFollowButtonProps) {
    const { user: currentUser } = useClerkUser();
    const navigate = useNavigate();
    const { isFollowing, loading, toggleFollow } = useFollow(userId);
    const [isHovered, setIsHovered] = useState(false);

    // Don't show follow button for self
    if (currentUser?.id === userId) return null;

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (!currentUser) {
            navigate("/sign-in");
            return;
        }

        await toggleFollow();
        onFollowChange?.(!isFollowing);
    };

    const displayColor = isFollowing
        ? (isHovered ? "#ef4444" : "var(--text-tertiary)")
        : "#3b82f6";

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: "none",
                border: "none",
                padding: "2px 4px",
                fontSize: "13px",
                fontWeight: 700,
                color: displayColor,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                opacity: loading ? 0.6 : 1,
                display: "inline-flex",
                alignItems: "center",
                verticalAlign: "middle",
                userSelect: "none",
                minWidth: isFollowing ? "68px" : "auto" // Prevent layout jump
            }}
        >
            <span style={{ color: "var(--text-tertiary)", fontWeight: 1000, fontSize: "15px", opacity: 0.5, marginTop: "-2px" }}>·</span>
            <div style={{
                position: "relative",
                marginLeft: "4px",
                display: "inline-flex",
                height: "16px",
                alignItems: "center"
            }}>
                {isFollowing ? (
                    <>
                        <span style={{
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            opacity: isHovered ? 0 : 1,
                            transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                            whiteSpace: "nowrap"
                        }}>
                            Following
                        </span>
                        <span style={{
                            position: "absolute",
                            left: 0,
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            opacity: isHovered ? 1 : 0,
                            transform: isHovered ? "translateY(0)" : "translateY(4px)",
                            whiteSpace: "nowrap",
                            color: "#ef4444"
                        }}>
                            Unfollow
                        </span>
                    </>
                ) : (
                    <span>Follow</span>
                )}
            </div>
        </button>
    );
}
