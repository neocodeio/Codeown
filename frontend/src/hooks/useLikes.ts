import { useState, useEffect } from "react";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";

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
      // If we already have initial stats from the feed/parent, don't fetch again
      if (initialIsLiked !== undefined) return; // Modified: Only fetch if initialIsLiked is undefined

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
  }, [postId, userId, getToken, isLoaded, initialIsLiked]); // Modified: Removed initialLikeCount from dependencies

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

    if (!userId) {
      alert("Please sign in to like posts");
      return;
    }

    // Save previous state for rollback
    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;

    // Optimistically update UI
    const newIsLiked = !isLiked;
    const newCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

    setIsLiked(newIsLiked);
    setLikeCount(newCount);

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No token");

      const res = await api.post(
        `/likes/post/${postId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Verify with server response
      if (res.data) {
        const serverIsLiked = res.data.liked === true || res.data.isLiked === true;
        const serverCount = typeof res.data.likeCount === 'number' ? res.data.likeCount : res.data.count;
        if (serverIsLiked !== undefined) setIsLiked(serverIsLiked);
        if (serverCount !== undefined) setLikeCount(serverCount);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Rollback on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
    } finally {
      setLoading(false);
    }
  };

  return { isLiked, likeCount, loading, toggleLike, fetchLikeStatus };
}
