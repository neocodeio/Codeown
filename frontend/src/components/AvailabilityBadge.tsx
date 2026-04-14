import { memo } from "react";
import { Briefcase } from "phosphor-react";
import OGAvatarDecorator from "./OGAvatarDecorator";

interface AvailabilityBadgeProps {
    avatarUrl: string | null;
    name: string;
    size?: number;
    isOpenToOpportunities?: boolean;
    tooltipText?: string;
    isOG?: boolean;
    username?: string | null;
    isOnline?: boolean;
}

const AvailabilityBadge = memo(({
    avatarUrl,
    name,
    size = 40,
    isOpenToOpportunities = false,
    tooltipText = "Open to opportunities",
    isOG = false,
    isOnline = false,
}: AvailabilityBadgeProps) => {
    const showBadge = isOpenToOpportunities === true;
    // scale icon bg size: 35% of avatar size
    const briefcaseBgSize = Math.max(14, Math.round(size * 0.25));
    const briefcaseIconSize = Math.max(8, Math.round(briefcaseBgSize * 0.45));

    // Online dot size: 20% of avatar size
    const onlineDotSize = Math.max(10, Math.round(size * 0.20));

    return (
        <div style={{ position: "relative", display: "inline-flex" }}>
            <OGAvatarDecorator is_og={isOG} size={size}>
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
                            borderRadius: "100%",
                            position: "relative",
                            overflow: "hidden",
                            backgroundColor: "var(--bg-hover)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: showBadge ? `1px solid var(--text-primary)` : "0.5px solid var(--border-hairline)",
                            boxSizing: "border-box",
                            zIndex: 1
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
                            }}
                        />
                    </div>

                    {showBadge && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: "-2px",
                                right: "-2px",
                                width: briefcaseBgSize,
                                height: briefcaseBgSize,
                                backgroundColor: "var(--text-primary)",
                                color: "var(--bg-page)",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "2px solid var(--bg-page)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
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
            </OGAvatarDecorator>

            {/* Online Indicator - Outside OG Decorator to prevent clipping */}
            {isOnline && (
                <div
                    style={{
                        position: "absolute",
                        bottom: showBadge ? "10px" : "2px",
                        right: showBadge ? "14px" : "2px",
                        width: onlineDotSize,
                        height: onlineDotSize,
                        backgroundColor: "#22c55e",
                        borderRadius: "50%",
                        zIndex: 100, // Very high to be over everything
                    }}
                    title="Online"
                />
            )}
        </div>
    );
});

export default AvailabilityBadge;
