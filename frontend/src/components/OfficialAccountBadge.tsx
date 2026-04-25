import Tooltip from './Tooltip';

interface OfficialAccountBadgeProps {
    username?: string | null;
    size?: string;
}

export default function OfficialAccountBadge({ username, size = "14px" }: OfficialAccountBadgeProps) {
    const isOfficial = username?.toLowerCase() === "codeown.official";

    if (isOfficial) {
        return (
            <Tooltip text="Official Codeown Account" position="top">
                <div
                    style={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "center",
                        cursor: "pointer"
                    }}
                >
                    <svg
                        width={size}
                        height={size}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                            marginLeft: "2px",
                            marginRight: "2px",
                            verticalAlign: "middle",
                            flexShrink: 0,
                            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))"
                        }}
                    >
                        <defs>
                            <linearGradient id="goldGradient_badge" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FFD700" />
                                <stop offset="100%" stopColor="#FFA500" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M12 2L14.4 4.5L17.8 4L18.6 7.3L21.7 8.8L20.8 12.1L22.5 15.1L19.5 16.9L18.2 20.1L14.8 20.2L12 22.4L9.2 20.2L5.8 20.1L4.5 16.9L1.5 15.1L3.2 12.1L2.3 8.8L5.4 7.3L6.2 4L9.6 4.5L12 2Z"
                            fill="url(#goldGradient_badge)"
                        />
                        <path
                            d="M8.5 12.5L10.5 14.5L15.5 9.5"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </Tooltip>
        );
    }
    return null;
}
