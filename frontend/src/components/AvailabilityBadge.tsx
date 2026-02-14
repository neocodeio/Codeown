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
    ringColor = "#3b82f6" // Subtle blue
}: AvailabilityBadgeProps) {
    const containerSize = size;
    // Scale briefcase size proportionally: 28% of avatar size, minimum 20px for better visibility
    const briefcaseBgSize = Math.max(20, Math.round(size * 0.28));
    // Icon is 58% of the background circle for better visibility
    const briefcaseIconSize = Math.round(briefcaseBgSize * 0.58);

    return (
        <div
            className="availability-badge-container"
            title={isOpenToOpportunities ? tooltipText : undefined}
            style={{
                position: "absolute",
                width: `${containerSize}px`,
                height: `${containerSize}px`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    padding: isOpenToOpportunities ? "2px" : "0",
                    border: isOpenToOpportunities ? `2px solid ${ringColor}` : "none",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                }}
            >
                <img
                    src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=212121&color=ffffff&bold=true`}
                    alt={name}
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                        backgroundColor: "#f1f5f9"
                    }}
                />
            </div>

            {isOpenToOpportunities && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "-5%",
                        right: "10%",
                        width: `${briefcaseBgSize}px`,
                        height: `${briefcaseBgSize}px`,
                        backgroundColor: "#fff",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.15), 0 0 0 2.5px #ffffff",
                        zIndex: 2,
                    }}
                >
                    <FontAwesomeIcon
                        icon={faBriefcase}
                        style={{
                            fontSize: `${briefcaseIconSize}px`,
                            color: ringColor,
                            position: "fixed",
                        }}
                    />
                </div>
            )}
        </div>
    );
}
