import { useEffect, useState } from "react";
import api from "../api/axios";
import type { Post } from "./usePosts";

export function useUserPosts(userId: string | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPosts = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/posts/user/${userId}`);
      setPosts(res.data);
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

