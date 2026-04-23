import React, { useState } from "react";

interface FollowButtonProps {
    isFollowing: boolean;
    onClick: () => void;
    size?: "sm" | "md";
}

export default function FollowButton({ isFollowing, onClick, size = "md" }: FollowButtonProps) {
    const [isHovered, setIsHovered] = useState(false);

    const getButtonText = () => {
        if (!isFollowing) return "Follow";
        if (isHovered) return "Unfollow";
        return "Followed";
    };

    const getButtonStyle = () => {
        const isSm = size === "sm";
        const base: React.CSSProperties = {
            padding: isSm ? "0 14px" : "8px 16px",
            height: isSm ? "32px" : "38px",
            borderRadius: "100px",
            fontSize: isSm ? "12px" : "14px",
            fontWeight: 800,
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            border: "1px solid var(--border-hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: isSm ? "82px" : "100px"
        };

        if (!isFollowing) {
            return {
                ...base,
                backgroundColor: "var(--text-primary)",
                color: "var(--bg-page)",
                border: "none",
                transform: isHovered ? "scale(1.02)" : "scale(1)"
            };
        }

        if (isHovered) {
            return {
                ...base,
                backgroundColor: "rgba(239, 68, 68, 0.1)", // Light red
                color: "#ef4444", // Red
                borderColor: "rgba(239, 68, 68, 0.2)",
                transform: "scale(1.02)",
            };
        }

        return {
            ...base,
            backgroundColor: "transparent",
            color: "var(--text-primary)",
            opacity: 0.8
        };
    };

    return (
        <button 
            onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                onClick(); 
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={getButtonStyle()}
        >
            {getButtonText()}
        </button>
    );
}
