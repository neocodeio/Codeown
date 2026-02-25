import { useState, useEffect } from "react";
import { useClerkAuth } from "./useClerkAuth";
import api from "../api/axios";

export function useProjectLikes(projectId: number, initialIsLiked?: boolean, initialLikeCount?: number) {
  const [isLiked, setIsLiked] = useState(initialIsLiked ?? false);
  const [likeCount, setLikeCount] = useState(initialLikeCount ?? 0);
  const { getToken, userId, isLoaded } = useClerkAuth();

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

  const fetchLikeStatus = async () => {
    if (!userId || !projectId) return;

    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.get(`/projects/${projectId}/like`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsLiked(response.data.isLiked);
      setLikeCount(response.data.likeCount || 0);
    } catch (error) {
      console.error("Error fetching like status:", error);
    }
  };

  const toggleLike = async () => {
    if (!userId) {
      alert("Please sign in to upvote projects");
      return;
    }

    // Save previous state for rollback
    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;

    // Optimistically update UI
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);

    try {
      const token = await getToken();
      if (!token) throw new Error("No token");

      const response = await api.post(
        `/projects/${projectId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Verify with server response just in case
      if (response.data) {
        setIsLiked(response.data.isLiked);
        setLikeCount(response.data.likeCount);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Rollback on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
    }
  };

  useEffect(() => {
    // If we already have initial stats, don't fetch again
    if (initialIsLiked !== undefined && initialLikeCount !== undefined) return;

    if (projectId && userId && isLoaded) {
      fetchLikeStatus();
    }
  }, [projectId, userId, isLoaded, initialIsLiked, initialLikeCount]);

  return { isLiked, likeCount, toggleLike, fetchLikeStatus };
}
