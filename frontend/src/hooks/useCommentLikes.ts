
import { useState, useCallback, useEffect } from "react";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";
import { socket } from "../lib/socket";

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
    setLoading(true);
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await api.get(`/likes/comment/${commentId}?type=${resourceType || ""}`, { headers });
      setIsLiked(res.data.isLiked === true);
      setLikeCount(res.data.count || 0);
    } catch {
      setIsLiked(false);
      setLikeCount(0);
    } finally {
      setLoading(false);
    }
  }, [commentId, isLoaded, getToken, resourceType, initialIsLiked]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const toggleLike = useCallback(async () => {
    if (!commentId) return;

    // Optimistic Update
    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;

    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);
    setLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        // Rollback if no token
        setIsLiked(previousIsLiked);
        setLikeCount(previousLikeCount);
        setLoading(false);
        return;
      }
      const res = await api.post(
        `/likes/comment/${commentId}?type=${resourceType || ""}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update with server truth
      if (res.data) {
        setIsLiked(res.data.liked === true);
        setLikeCount(res.data.likeCount ?? (res.data.liked ? likeCount + 1 : likeCount - 1));
      }
    } catch (err) {
      console.error("Error toggling comment like:", err);
      // Rollback on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
    } finally {
      setLoading(false);
    }
  }, [commentId, getToken, isLiked, likeCount, resourceType]);

  useEffect(() => {
    if (!commentId) return;

    const handleCommentLiked = (payload: { id: number, likeCount: number, type: string }) => {
      // Check if it matches this comment and resource context (if applicable)
      if (Number(payload.id) === Number(commentId)) {
        setLikeCount(payload.likeCount);
      }
    };

    socket.on("comment_liked", handleCommentLiked);
    return () => {
      socket.off("comment_liked", handleCommentLiked);
    };
  }, [commentId]);

  return { isLiked, likeCount, loading, toggleLike, fetchStatus };
}
