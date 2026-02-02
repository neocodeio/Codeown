import { useState, useEffect } from "react";
import { useClerkAuth } from "./useClerkAuth";
import api from "../api/axios";

export function useProjectLikes(projectId: number, initialIsLiked?: boolean, initialLikeCount?: number) {
  const [isLiked, setIsLiked] = useState(initialIsLiked ?? false);
  const [likeCount, setLikeCount] = useState(initialLikeCount ?? 0);
  const [loading, setLoading] = useState(false);
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
      alert("Please sign in to like projects");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.post(
        `/projects/${projectId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsLiked(response.data.isLiked);
      setLikeCount(response.data.likeCount);
    } catch (error) {
      console.error("Error toggling like:", error);
      await fetchLikeStatus();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && userId && isLoaded) {
      fetchLikeStatus();
    }
  }, [projectId, userId, isLoaded]);

  return { isLiked, likeCount, loading, toggleLike, fetchLikeStatus };
}
