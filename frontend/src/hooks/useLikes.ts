import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";

export function useLikes(postId: number | null) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { getToken, isLoaded } = useClerkAuth();

  const fetchLikeStatus = useCallback(async () => {
    if (!postId || !isLoaded) {
      setIsLiked(false);
      setLikeCount(0);
      return;
    }
    
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await api.get(`/likes/post/${postId}`, { headers });
      const likedStatus = res.data.isLiked === true;
      setIsLiked(likedStatus);
      setLikeCount(res.data.count || 0);
      console.log(`Post ${postId} like status:`, { isLiked: likedStatus, count: res.data.count });
    } catch (error) {
      console.error("Error fetching like status:", error);
      setIsLiked(false);
      setLikeCount(0);
    }
  }, [postId, isLoaded, getToken]);

  useEffect(() => {
    fetchLikeStatus();
  }, [fetchLikeStatus]);

  const toggleLike = async () => {
    if (!postId) return;
    
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        alert("Please sign in to like posts");
        setLoading(false);
        return;
      }

      const res = await api.post(
        `/likes/post/${postId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update state immediately for better UX
      const newLikedState = res.data.liked === true;
      console.log(`Post ${postId} toggle result:`, { liked: newLikedState, response: res.data });
      setIsLiked(newLikedState);
      
      // Update count based on new state
      if (newLikedState) {
        setLikeCount((prev) => prev + 1);
      } else {
        setLikeCount((prev) => Math.max(0, prev - 1));
      }

      // Refresh like status from server to ensure consistency
      setTimeout(() => {
        fetchLikeStatus();
      }, 200);
    } catch (error) {
      console.error("Error toggling like:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to like post";
      alert(`Failed to like post: ${errorMessage}`);
      // Refresh status on error to get correct state
      await fetchLikeStatus();
    } finally {
      setLoading(false);
    }
  };

  return { isLiked, likeCount, loading, toggleLike, fetchLikeStatus };
}
