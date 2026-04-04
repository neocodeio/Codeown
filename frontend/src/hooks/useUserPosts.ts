import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import type { Post } from "./usePosts";

export function useUserPosts(userId: string | null) {
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading: loading } = useQuery({
    queryKey: ["userPosts", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await api.get(`/posts/user/${userId}`);
      const postsData = Array.isArray(res.data) ? res.data : (res.data?.posts || res.data?.data || []);
      return postsData as Post[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const fetchUserPosts = async () => {
    await queryClient.invalidateQueries({ queryKey: ["userPosts", userId] });
  };

  return { posts, loading, fetchUserPosts };
}
