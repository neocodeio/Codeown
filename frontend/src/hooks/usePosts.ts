import { useEffect, useState } from "react";
import api from "../api/axios";

export interface Post {
  id: number;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  images?: string[] | null;
  user?: {
    name: string;
    email: string | null;
    avatar_url?: string | null;
  };
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    const res = await api.get("/posts");
    setPosts(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return { posts, loading, fetchPosts };
}