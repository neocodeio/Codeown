import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";

export interface Notification {
  id: number;
  type: "like" | "comment" | "follow" | "mention" | "reply" | "save" | "message" | "profile_view";
  actor_id: string;
  post_id?: number | null;
  comment_id?: number | null;
  project_id?: number | null;
  read: boolean;
  created_at: string;
  actor?: {
    id: string;
    name: string;
    username: string | null;
    avatar_url: string | null;
  };
}

export function useNotifications() {
  const { getToken, isSignedIn } = useClerkAuth();
  const queryClient = useQueryClient();

  // Fetch full notifications list
  const {
    data: notifications = [],
    isLoading,
    refetch: fetchNotifications
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return [];
      const res = await api.get("/notifications?limit=20", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.notifications || [];
    },
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Kill notification polling - fetch only once on mount
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const fetchUnreadCountOnce = async () => {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        if (!token) return;
        const res = await api.get("/notifications/unread/count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUnreadCount(res.data.count || 0);
      } catch (e) {
        setUnreadCount(0);
      }
    };
    
    fetchUnreadCountOnce();
  }, []); // Empty dependency array - fetch only once on mount

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (notificationId: number | "all") => {
      const token = await getToken();
      if (!token) return;
      await api.put(`/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return notificationId;
    },
    onSuccess: (_notificationId) => {
      // More targeted invalidation - only update what's necessary
      queryClient.setQueryData(["notifications", "unreadCount"], 0);
      if (_notificationId === "all") {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    }
  });

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    notifications,
    unreadCount,
    loading: isLoading,
    fetchNotifications,
    markAsRead: markReadMutation.mutate,
    refreshUnreadCount: () => {}, // No-op since we fetch only once on mount
  }), [notifications, unreadCount, isLoading, fetchNotifications, markReadMutation.mutate]);
}
