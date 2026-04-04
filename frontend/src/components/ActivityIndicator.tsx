import { useEffect, useState } from "react";
import { socket } from "../lib/socket";
import { Pencil, Rocket, ChatCircle, ChatDots } from "phosphor-react";

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

    if (activities.length === 0) return null;

    // Show the most recent activity
    const latest = activities[activities.length - 1];

    const getIcon = () => {
        switch (latest.type) {
            case "posting": return <Pencil size={12} weight="fill" />;
            case "launching": return <Rocket size={12} weight="fill" />;
            case "chatting": return <ChatCircle size={12} weight="fill" />;
            case "commenting": return <ChatDots size={12} weight="fill" />;
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
            bottom: "-24px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 12px",
            backgroundColor: "transparent",
            borderRadius: "100px",
            zIndex: 50,
            pointerEvents: "none",
            animation: "fadeInUp 0.3s cubic-bezier(0.2, 0, 0, 1) forwards"
        }}>
            <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                <div className="dot" style={{ width: "3px", height: "3px", borderRadius: "50%", backgroundColor: "var(--text-tertiary)", animation: "pulse 1.2s infinite 0s" }} />
                <div className="dot" style={{ width: "3px", height: "3px", borderRadius: "50%", backgroundColor: "var(--text-tertiary)", animation: "pulse 1.2s infinite 0.2s" }} />
                <div className="dot" style={{ width: "3px", height: "3px", borderRadius: "50%", backgroundColor: "var(--text-tertiary)", animation: "pulse 1.2s infinite 0.4s" }} />
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", fontStyle: "italic" }}>
                    {latest.userName.split(" ")[0]}
                </span>
                <span style={{ fontSize: "12px", fontWeight: "400", color: "var(--text-tertiary)", fontStyle: "italic" }}>
                    {getActionText()}
                </span>
                <span style={{ color: "var(--text-tertiary)", display: "flex", alignItems: "center", opacity: 0.8 }}>
                    {getIcon()}
                </span>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translate(-50%, 4px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                @keyframes pulse {
                    0% { transform: scale(0.8); opacity: 0.3; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(0.8); opacity: 0.3; }
                }
            `}</style>
        </div>
    );
}
