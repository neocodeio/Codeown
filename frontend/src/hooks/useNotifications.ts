import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";

export interface Notification {
  id: number;
  type: "like" | "comment" | "follow" | "mention";
  actor_id: string;
  post_id?: number | null;
  comment_id?: number | null;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { getToken, isSignedIn } = useClerkAuth();

  const fetchNotifications = useCallback(async () => {
    if (!isSignedIn) return;
    
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await api.get("/notifications?limit=20", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, getToken]);

  const fetchUnreadCount = useCallback(async () => {
    if (!isSignedIn) return;
    
    try {
      const token = await getToken();
      if (!token) return;

      const res = await api.get("/notifications/unread/count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(res.data.count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [isSignedIn, getToken]);

  const markAsRead = async (notificationId: number | "all") => {
    try {
      const token = await getToken();
      if (!token) return;

      await api.put(
        `/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (notificationId === "all") {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    refreshUnreadCount: fetchUnreadCount,
  };
}
