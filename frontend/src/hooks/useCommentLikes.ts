
import { useState, useCallback, useEffect } from "react";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";

export function useCommentLikes(commentId: number | string | null, resourceType?: "post" | "project", initialIsLiked?: boolean, initialLikeCount?: number) {
  const [isLiked, setIsLiked] = useState(initialIsLiked ?? false);
  const [likeCount, setLikeCount] = useState(initialLikeCount ?? 0);
  const [loading, setLoading] = useState(false);
  const { getToken, isLoaded } = useClerkAuth();

  // Sync with initial values if they change
  useEffect(() => {
    if (initialIsLiked !== undefined) {
      setIsLiked(initialIsLiked);
    }
  }, [initialIsLiked]);

  useEffect(() => {
    if (initialLikeCount !== undefined) {
      setLikeCount(initialLikeCount);
    }
  }, [initialLikeCount]);

  const fetchStatus = useCallback(async () => {
    if (!commentId || !isLoaded || initialIsLiked !== undefined) return;
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await api.get(`/likes/comment/${commentId}?type=${resourceType || ''}`, { headers });
      setIsLiked(res.data.isLiked === true);
      setLikeCount(res.data.count || 0);
    } catch {
      setIsLiked(false);
      setLikeCount(0);
    }
  }, [commentId, isLoaded, getToken, resourceType, initialIsLiked]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const toggleLike = useCallback(async () => {
    if (!commentId) return;
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await api.post(`/likes/comment/${commentId}?type=${resourceType || ''}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIsLiked(res.data.liked === true);
      setLikeCount(res.data.likeCount ?? (res.data.liked ? likeCount + 1 : likeCount - 1));
    } catch {
      fetchStatus();
    } finally {
      setLoading(false);
    }
  }, [commentId, getToken, likeCount, fetchStatus, resourceType]);

  return { isLiked, likeCount, loading, toggleLike, fetchStatus };
}
