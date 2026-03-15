import { Briefcase, Rocket } from "phosphor-react";

interface AvailabilityBadgeProps {
    avatarUrl: string | null;
    name: string;
    size?: number;
    isOpenToOpportunities?: boolean;
    isEarlyAdopter?: boolean;
    tooltipText?: string;
}

export default function AvailabilityBadge({
    avatarUrl,
    name,
    size = 40,
    isOpenToOpportunities = false,
    isEarlyAdopter = false,
    tooltipText = "Open to opportunities",
}: AvailabilityBadgeProps) {
    const showBadge = isOpenToOpportunities === true;
    // scale icon bg size: 35% of avatar size
    const briefcaseBgSize = Math.max(14, Math.round(size * 0.25));
    const briefcaseIconSize = Math.max(8, Math.round(briefcaseBgSize * 0.45));

    return (
        <div
            className="availability-badge-container"
            title={showBadge ? tooltipText : undefined}
            style={{
                position: "relative",
                width: size,
                height: size,
                maxWidth: "100%",
                maxHeight: "100%",
                display: "inline-flex",
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "var(--radius-xs)",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "var(--bg-hover)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: isEarlyAdopter
                        ? `2px solid var(--text-primary)`
                        : showBadge
                            ? `1px solid var(--text-primary)`
                            : "0.5px solid var(--border-hairline)",
                    boxSizing: "border-box",
                    zIndex: 1,
                    // Add a subtle inner glow for early adopters
                    boxShadow: isEarlyAdopter ? "inset 0 0 10px rgba(255, 255, 255, 0.1)" : "none"
                }}
            >
                <img
                    src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=000&color=fff&bold=true`}
                    alt={name}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        transform: isEarlyAdopter ? "scale(1.05)" : "none" // Slight zoom for premium feel
                    }}
                />
            </div>

            {/* Early Adopter Badge - Top Right */}
            {isEarlyAdopter && (
                <div
                    title="Early Adopter_#001"
                    style={{
                        position: "absolute",
                        top: "-4px",
                        right: "-4px",
                        width: briefcaseBgSize,
                        height: briefcaseBgSize,
                        backgroundColor: "var(--text-primary)",
                        color: "var(--bg-page)",
                        borderRadius: "2px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid var(--bg-page)",
                        zIndex: 10,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                >
                    <Rocket
                        size={briefcaseIconSize}
                        weight="fill"
                    />
                </div>
            )}

            {showBadge && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "-4px",
                        right: "-4px",
                        width: briefcaseBgSize,
                        height: briefcaseBgSize,
                        backgroundColor: "var(--text-primary)",
                        color: "var(--bg-page)",
                        borderRadius: "0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid var(--bg-page)",
                        zIndex: 10,
                    }}
                >
                    <Briefcase
                        size={briefcaseIconSize}
                        weight="fill"
                    />
                </div>
            )}
        </div>
    );
}
