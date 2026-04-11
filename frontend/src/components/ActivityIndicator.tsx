import { useEffect, useState } from "react";
import { socket } from "../lib/socket";
import { HugeiconsIcon } from "@hugeicons/react";
import { useWindowSize } from "../hooks/useWindowSize";
import { 
    PencilEdit01Icon, 
    Rocket01Icon, 
    Message01Icon, 
    BubbleChatIcon 
} from "@hugeicons/core-free-icons";

interface Activity {
    userId: string;
    userName: string;
    type: "posting" | "launching" | "chatting" | "commenting";
    timestamp: number;
}

export default function ActivityIndicator() {
    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        const handleActivity = (data: { userId: string, userName: string, type: any }) => {
            if (!data.type) {
                // If type is null/empty, mark for removal
                setActivities(prev => prev.filter(a => a.userId !== data.userId));
                return;
            }

            setActivities(prev => {
                // Remove existing activity for this user if any
                const filtered = prev.filter(a => a.userId !== data.userId);
                return [...filtered, { ...data, timestamp: Date.now() }];
            });
        };

        socket.on("global_activity", handleActivity);

        // Auto-cleanup stale activities (after 4 seconds)
        const interval = setInterval(() => {
            setActivities(prev => prev.filter(a => Date.now() - a.timestamp < 4000));
        }, 1000);

        return () => {
            socket.off("global_activity", handleActivity);
            clearInterval(interval);
        };
    }, []);

    const { width } = useWindowSize();
    const isMobile = width < 768;

    if (activities.length === 0 || isMobile) return null;

    // Show the most recent activity
    const latest = activities[activities.length - 1];

    const getIcon = () => {
        switch (latest.type) {
            case "posting": return <HugeiconsIcon icon={PencilEdit01Icon} size={14} />;
            case "launching": return <HugeiconsIcon icon={Rocket01Icon} size={14} />;
            case "chatting": return <HugeiconsIcon icon={Message01Icon} size={14} />;
            case "commenting": return <HugeiconsIcon icon={BubbleChatIcon} size={14} />;
            default: return null;
        }
    };

    const getActionText = () => {
        switch (latest.type) {
            case "posting": return "is posting...";
            case "launching": return "is launching...";
            case "chatting": return "is chatting...";
            case "commenting": return "is commenting...";
            default: return "";
        }
    };

    return (
        <div style={{
            position: "absolute",
            left: isMobile ? "12px" : "20px",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 10px",
            backgroundColor: "var(--bg-hover)",
            border: "0.5px solid var(--border-hairline)",
            borderRadius: "6px",
            zIndex: 10,
            pointerEvents: "none",
            animation: "indicatorSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        }}>
            <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                <div style={{ width: "2px", height: "2px", borderRadius: "50%", backgroundColor: "var(--text-tertiary)", animation: "dotPulse 1.2s infinite" }} />
                <div style={{ width: "2px", height: "2px", borderRadius: "50%", backgroundColor: "var(--text-tertiary)", animation: "dotPulse 1.2s infinite 0.2s" }} />
                <div style={{ width: "2px", height: "2px", borderRadius: "50%", backgroundColor: "var(--text-tertiary)", animation: "dotPulse 1.2s infinite 0.4s" }} />
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                    {latest.userName.split(" ")[0]}
                </span>
                <span style={{ fontSize: "10px", fontWeight: "400", color: "var(--text-tertiary)", opacity: 0.8 }}>
                    {getActionText()}
                </span>
                <span style={{ color: "var(--text-primary)", display: "flex", alignItems: "center", opacity: 0.7 }}>
                    {getIcon()}
                </span>
            </div>

            <style>{`
                @keyframes indicatorSlideIn {
                    from { opacity: 0; transform: translateY(-50%) translateX(-10px); }
                    to { opacity: 1; transform: translateY(-50%) translateX(0); }
                }
                @keyframes dotPulse {
                    0% { transform: scale(0.8); opacity: 0.4; }
                    50% { transform: scale(1.3); opacity: 1; }
                    100% { transform: scale(0.8); opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}
