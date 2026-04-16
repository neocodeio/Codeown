import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";

export interface Notification {
  id: number;
  type: "like" | "comment" | "follow" | "mention" | "reply" | "save" | "message" | "profile_view" | "project_view" | "cofounder_request" | "streak_warning" | "milestone" | "startup_upvote";
  actor_id: string;
  post_id?: number | null;
  comment_id?: number | null;
  project_id?: number | null;
  startup_id?: string | null;

  content?: string | null;
  read: boolean;
  created_at: string;
  metadata?: any;
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
    data: allNotifications = [],
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
    staleTime: 30 * 1000,           // consider data fresh for 30s
    refetchInterval: 10 * 1000,     // poll every 10s for near‑realtime updates
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

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
      // Optimistically update local cache so badges drop immediately
      queryClient.setQueryData<Notification[]>(["notifications"], (old = []) => {
        if (_notificationId === "all") {
          // Only mark non-message notifications as read in cache
          return old.map((n) => (n.type !== "message" ? { ...n, read: true } : n));
        }
        return old.map((n) =>
          n.id === _notificationId ? { ...n, read: true } : n
        );
      });
    },
  });

  // Filter out message notifications for the general UI
  const notifications = useMemo(
    () => allNotifications.filter((n: Notification) => n.type !== "message"),
    [allNotifications]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n: Notification) => !n.read).length,
    [notifications]
  );

  const messageUnreadCount = useMemo(
    () =>
      allNotifications.filter(
        (n: Notification) => !n.read && n.type === "message"
      ).length,
    [allNotifications]
  );

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    notifications,
    unreadCount,
    messageUnreadCount,
    loading: isLoading,
    fetchNotifications,
    markAsRead: markReadMutation.mutate,
    clearMessageNotifications: (actorId: string) => {
      queryClient.setQueryData<Notification[]>(["notifications"], (old = []) => {
        return old.map(n => (n.type === "message" && n.actor_id === actorId) ? { ...n, read: true } : n);
      });
    },
    refreshUnreadCount: () => { }, // No-op since we fetch only once on mount
  }), [notifications, unreadCount, messageUnreadCount, isLoading, fetchNotifications, markReadMutation.mutate, queryClient]);
}
