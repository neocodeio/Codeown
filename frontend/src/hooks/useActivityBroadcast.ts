import { useCallback, useRef } from "react";
import { socket } from "../lib/socket";
import { useClerkUser } from "./useClerkUser";

/**
 * Hook to broadcast global activity (typing, launching, etc.) 
 * to the entire community via Socket.io.
 */
export function useActivityBroadcast() {
    const { user, isSignedIn } = useClerkUser();
    const lastEmitRef = useRef<number>(0);
    const timeoutRef = useRef<any>(null);

    const announce = useCallback((type: "posting" | "launching" | "chatting" | "commenting" | null) => {
        if (!isSignedIn || !user?.id) return;

        const now = Date.now();
        // Throttle emits to every 2 seconds
        if (type !== null && now - lastEmitRef.current < 2000) return;

        if (type !== null) lastEmitRef.current = now;

        socket.emit("broadcast_activity", {
            userId: user.id,
            userName: user.fullName || user.username || "User",
            type
        });

        // If we set an activity, auto-clear it after 4 seconds of silence
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (type !== null) {
            timeoutRef.current = setTimeout(() => {
                socket.emit("broadcast_activity", {
                    userId: user.id,
                    userName: user.fullName || user.username || "User",
                    type: null
                });
            }, 4000);
        }
    }, [isSignedIn, user?.id, user?.fullName, user?.username]);

    return { announce };
}
