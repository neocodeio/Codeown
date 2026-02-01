import { useState, useEffect } from "react";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";
import { useClerkUser } from "./useClerkUser";

export function useLikes(postId: number | null, initialIsLiked?: boolean, initialLikeCount?: number) {
  const [isLiked, setIsLiked] = useState(initialIsLiked ?? false);
  const [likeCount, setLikeCount] = useState(initialLikeCount ?? 0);
  const [loading, setLoading] = useState(false);
  const { getToken, isLoaded, userId } = useClerkAuth();

  // Sync with initial values if they change (e.g. from parent props after refresh)
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

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      if (!isLoaded || !postId) return;

      try {
        let headers = {};
        if (userId) {
          const token = await getToken();
          if (!token) return;
          headers = { Authorization: `Bearer ${token}` };
        }

        const res = await api.get(`/likes/post/${postId}`, { headers });

        if (isMounted && res.data) {
          // Handle both count/likeCount and isLiked/liked property names
          const newIsLiked = typeof res.data.isLiked === 'boolean' ? res.data.isLiked : res.data.liked;
          const newCount = typeof res.data.count === 'number' ? res.data.count : res.data.likeCount;

          if (newIsLiked !== undefined) setIsLiked(newIsLiked);
          if (newCount !== undefined) setLikeCount(newCount);
        }
      } catch (error) {
        console.error("Error fetching like status:", error);
      }
    };

    fetchStatus();

    return () => { isMounted = false; };
  }, [postId, userId, getToken, isLoaded]);

  const fetchLikeStatus = async () => {
    if (!postId) return;
    try {
      let headers = {};
      if (userId) {
        const token = await getToken();
        if (!token) return;
        headers = { Authorization: `Bearer ${token}` };
      }
      const res = await api.get(`/likes/post/${postId}`, { headers });
      if (res.data) {
        const newIsLiked = typeof res.data.isLiked === 'boolean' ? res.data.isLiked : res.data.liked;
        const newCount = typeof res.data.count === 'number' ? res.data.count : res.data.likeCount;
        if (newIsLiked !== undefined) setIsLiked(newIsLiked);
        if (newCount !== undefined) setLikeCount(newCount);
      }
    } catch (error) {
      console.error("Error fetching like status:", error);
    }
  };

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

      // Update state immediately from server response
      const newLikedState = res.data.liked === true || res.data.isLiked === true;
      setIsLiked(newLikedState);

      // Smart count update
      const newCount = typeof res.data.likeCount === 'number' ? res.data.likeCount : res.data.count;
      if (newCount !== undefined) {
        setLikeCount(newCount);
      } else {
        // Fallback optimistic update
        if (newLikedState) {
          setLikeCount((prev) => prev + 1);
        } else {
          setLikeCount((prev) => Math.max(0, prev - 1));
        }
      }

    } catch (error) {
      console.error("Error toggling like:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to like post";
      alert(`Failed to like post: ${errorMessage}`);
      await fetchLikeStatus();
    } finally {
      setLoading(false);
    }
  };

  return { isLiked, likeCount, loading, toggleLike, fetchLikeStatus };
}
