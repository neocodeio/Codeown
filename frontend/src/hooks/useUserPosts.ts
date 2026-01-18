import { useEffect, useState } from "react";
import api from "../api/axios";
import type { Post } from "./usePosts";

export function useUserPosts(userId: string | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPosts = async () => {
    if (!userId) {
      setLoading(false);
      setPosts([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/posts/user/${userId}`);
      // Ensure posts is always an array
      const postsData = Array.isArray(res.data) ? res.data : (res.data?.posts || res.data?.data || []);
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { posts, loading, fetchUserPosts };
}

