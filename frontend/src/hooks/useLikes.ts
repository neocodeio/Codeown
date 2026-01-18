import { useState, useEffect } from "react";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";

export function useLikes(postId: number | null) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { getToken, isLoaded } = useClerkAuth();

  const fetchLikeStatus = async () => {
    if (!postId || !isLoaded) return;
    
    try {
      const res = await api.get(`/likes/post/${postId}`);
      setIsLiked(res.data.isLiked || false);
      setLikeCount(res.data.count || 0);
    } catch (error) {
      console.error("Error fetching like status:", error);
    }
  };

  useEffect(() => {
    fetchLikeStatus();
  }, [postId, isLoaded]);

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

      setIsLiked(res.data.liked);
      if (res.data.liked) {
        setLikeCount((prev) => prev + 1);
      } else {
        setLikeCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to like post";
      alert(`Failed to like post: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return { isLiked, likeCount, loading, toggleLike, fetchLikeStatus };
}
