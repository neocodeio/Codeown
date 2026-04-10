import { useState, useEffect } from "react";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";
import { socket } from "../lib/socket";
import { useQueryClient } from "@tanstack/react-query";

export function useLikes(postId: number | null, initialIsLiked?: boolean, initialLikeCount?: number) {
  const [isLiked, setIsLiked] = useState(initialIsLiked ?? false);
  const [likeCount, setLikeCount] = useState(initialLikeCount ?? 0);
  const [loading, setLoading] = useState(false);
  const { getToken, isLoaded, userId } = useClerkAuth();
  const queryClient = useQueryClient();

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

  const updateReactQueryCache = (newIsLiked: boolean, newCount: number) => {
    if (!postId) return;

    // Update infinite feed queries
    queryClient.setQueriesData({ queryKey: ["posts"] }, (old: any) => {
      if (!old || !old.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: (page.posts || []).map((p: any) => 
            p.id === postId ? { ...p, isLiked: newIsLiked, like_count: newCount } : p
          )
        }))
      };
    });

    // Update detail post queries (using both string and number IDs to be safe)
    queryClient.setQueryData(["post", String(postId)], (old: any) => {
      if (!old) return old;
      return { ...old, isLiked: newIsLiked, like_count: newCount };
    });
    queryClient.setQueryData(["post", Number(postId)], (old: any) => {
      if (!old) return old;
      return { ...old, isLiked: newIsLiked, like_count: newCount };
    });
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
    updateReactQueryCache(newIsLiked, newCount);

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
        if (serverIsLiked !== undefined) {
          setIsLiked(serverIsLiked);
          setLikeCount(serverCount);
          updateReactQueryCache(serverIsLiked, serverCount);
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Rollback on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
      updateReactQueryCache(previousIsLiked, previousLikeCount);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    if (!postId) return;

    const handlePostLiked = (payload: { id: number, likeCount: number }) => {
      if (payload.id === postId) {
        setLikeCount(payload.likeCount);
      }
    };

    socket.on("post_liked", handlePostLiked);
    return () => {
      socket.off("post_liked", handlePostLiked);
    };
  }, [postId]);

  return { isLiked, likeCount, loading, toggleLike, fetchLikeStatus };
}
