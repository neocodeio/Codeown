import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBriefcase } from "@fortawesome/free-solid-svg-icons";

interface AvailabilityBadgeProps {
    avatarUrl: string | null;
    name: string;
    size?: number;
    isOpenToOpportunities?: boolean;
    tooltipText?: string;
    ringColor?: string;
}

export default function AvailabilityBadge({
    avatarUrl,
    name,
    size = 40,
    isOpenToOpportunities = false,
    tooltipText = "Open to opportunities",
    ringColor = "#3b82f6"
}: AvailabilityBadgeProps) {
    // scale icon bg size: 35% of avatar size
    const briefcaseBgSize = Math.max(14, Math.round(size * 0.25));
    const briefcaseIconSize = Math.max(8, Math.round(briefcaseBgSize * 0.45));

    return (
        <div
            className="availability-badge-container"
            title={isOpenToOpportunities ? tooltipText : undefined}
            style={{
                position: "relative",
                width: size,
                height: size,
                display: "inline-flex",
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    // The ring is now part of the border to ensure it's visible and doesn't shrink content
                    border: isOpenToOpportunities ? `2.5px solid ${ringColor}` : "1px solid rgba(0,0,0,0.08)",
                    boxSizing: "border-box",
                    zIndex: 1
                }}
            >
                <img
                    src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=212121&color=ffffff&bold=true`}
                    alt={name}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            </div>

            {isOpenToOpportunities && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        width: briefcaseBgSize,
                        height: briefcaseBgSize,
                        backgroundColor: "#fff",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2), 0 0 0 1.5px #fff",
                        zIndex: 10,
                    }}
                >
                    <FontAwesomeIcon
                        icon={faBriefcase}
                        style={{
                            fontSize: briefcaseIconSize,
                            color: ringColor,
                        }}
                    />
                </div>
            )}
        </div>
    );
}
