import { useState, useEffect } from "react";
import { useClerkAuth } from "./useClerkAuth";
import { useClerkUser } from "./useClerkUser";
import api from "../api/axios";

export function useProjectLikes(projectId: number) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { getToken } = useClerkAuth();
  const { user } = useClerkUser();

  const fetchLikeStatus = async () => {
    if (!user || !projectId) return;
    
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
    if (!user) {
      // Redirect to sign in or show sign in modal
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && user) {
      fetchLikeStatus();
    }
  }, [projectId, user]);

  return { isLiked, likeCount, loading, toggleLike, fetchLikeStatus };
}
