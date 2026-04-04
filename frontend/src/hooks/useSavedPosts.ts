import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";
import type { Post } from "./usePosts";

export function useSavedPosts() {
  const { getToken } = useClerkAuth();
  const queryClient = useQueryClient();

  const { data: savedPosts = [], isLoading: loading } = useQuery({
    queryKey: ["savedPosts"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return [];
      const res = await api.get("/posts/saved", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const postsData = Array.isArray(res.data) ? res.data : (res.data?.posts || res.data?.data || []);
      return postsData as Post[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const fetchSavedPosts = async () => {
    await queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
  };

  return { savedPosts, loading, fetchSavedPosts };
}
