import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";
import type { Post } from "./usePosts";

export function useSavedPosts() {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const { getToken, isLoaded } = useClerkAuth();

  const fetchSavedPosts = useCallback(async () => {
    if (!isLoaded) {
      setSavedPosts([]);
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setSavedPosts([]);
        setLoading(false);
        return;
      }

      const res = await api.get("/saved", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Ensure posts is always an array
      const postsData = Array.isArray(res.data.posts) ? res.data.posts : [];
      setSavedPosts(postsData);
    } catch (error) {
      console.error("Error fetching saved posts:", error);
      setSavedPosts([]);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, getToken]);

  useEffect(() => {
    fetchSavedPosts();
  }, [fetchSavedPosts]);

  return { savedPosts, loading, fetchSavedPosts };
}
