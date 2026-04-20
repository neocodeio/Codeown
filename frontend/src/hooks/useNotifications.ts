import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
    is_verified?: boolean;
  };
  post?: {
    title: string | null;
    content: string | null;
    image: string | null;
  } | null;
  project?: {
    name: string | null;
    image: string | null;
  } | null;
  actors?: any[]; // for grouped notifications
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useNotifications() {
  const { getToken, isSignedIn } = useClerkAuth();
  const queryClient = useQueryClient();

  // Infinite Scroll Notifications
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: fetchNotifications
  } = useInfiniteQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken();
      if (!token) throw new Error("No token");
      const res = await api.get(`/notifications?page=${pageParam}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: isSignedIn,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Reduced polling for infinite queries to save battery/bandwidth
  });

  // Separate query for unread count to keep it accurate and fast
  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return { count: 0 };
      const res = await api.get("/notifications/unread/count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: isSignedIn,
    refetchInterval: 10 * 1000, // Poll count more frequently
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
      // Update infinite query pages
      queryClient.setQueryData<any>(["notifications"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            notifications: page.notifications.map((n: any) => {
              if (_notificationId === "all") {
                return n.type !== "message" ? { ...n, read: true } : n;
              }
              return n.id === _notificationId ? { ...n, read: true } : n;
            })
          }))
        };
      });
      // Also update standalone unread count
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  // Flatten notifications for existing UI compatibility
  const allNotificationsFlattened = useMemo(() => {
    return data?.pages.flatMap(page => page.notifications) || [];
  }, [data]);

  const notifications = useMemo(
    () => allNotificationsFlattened.filter((n: Notification) => n.type !== "message"),
    [allNotificationsFlattened]
  );

  // Use the accurate unread count from its own query
  const unreadCount = unreadData?.count || 0;

  // For message unread count, we still look at the loaded notifications or we could have another query
  // Since messages aren't grouped/paginated as heavily here, we'll keep this logic
  const messageUnreadCount = useMemo(
    () =>
      allNotificationsFlattened.filter(
        (n: Notification) => !n.read && n.type === "message"
      ).length,
    [allNotificationsFlattened]
  );

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const token = await getToken();
      if (!token) return;
      await api.delete(`/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return notificationId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<any>(["notifications"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            notifications: page.notifications.filter((n: any) => n.id !== deletedId)
          }))
        };
      });
    },
  });

  return useMemo(() => ({
    notifications,
    unreadCount,
    messageUnreadCount,
    loading: isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    fetchNotifications,
    markAsRead: markReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,
    clearMessageNotifications: (actorId: string) => {
      queryClient.setQueryData<any>(["notifications"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            notifications: page.notifications.map((n: any) => (n.type === "message" && n.actor_id === actorId) ? { ...n, read: true } : n)
          }))
        };
      });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
    refreshUnreadCount: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  }), [notifications, unreadCount, messageUnreadCount, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, fetchNotifications, markReadMutation.mutate, deleteMutation.mutate, queryClient]);
}
