import Tooltip from './Tooltip';
import { CircleWavyCheck } from "phosphor-react";

interface VerifiedBadgeProps {
    username?: string | null;
    isPro?: boolean;
    size?: string;
    color?: string;
}

export default function VerifiedBadge({ username, isPro, size = "14px", color }: VerifiedBadgeProps) {
    const isOfficial = username?.toLowerCase() === "amin.ceo" || username?.toLowerCase() === "joethefounder" || username?.toLowerCase() === "waterskiermo" || username?.toLowerCase() === "andreascy";
    const shouldShow = isOfficial || isPro;

    if (shouldShow) {
        return (
            <Tooltip text={isOfficial ? "Verified Official Account" : "Pro Builder"} position="top">
                <div
                    style={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "center",
                        cursor: "pointer"
                    }}
                >
                    <CircleWavyCheck
                        size={size}
                        weight="fill"
                        color={color || "#00A2FF"}
                        aria-label="Verified Official Account"
                        style={{
                            color: (color || "#00A2FF") + " !important",
                            marginLeft: "2px",
                            marginRight: "2px",
                            verticalAlign: "middle",
                            flexShrink: 0,
                        }}
                    />
                </div>
            </Tooltip>
        );
    }
    return null;
}
