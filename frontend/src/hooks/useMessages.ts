import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";

export function useMessages() {
    const { getToken, userId } = useClerkAuth();

    const { data: unreadCount = 0, refetch: refetchUnreadCount } = useQuery({
        queryKey: ["messages-unread-count"],
        queryFn: async () => {
            const token = await getToken();
            if (!token) return 0;
            const response = await api.get("/messages/unread-count", {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.count;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
        unreadCount,
        refetchUnreadCount
    };
}
