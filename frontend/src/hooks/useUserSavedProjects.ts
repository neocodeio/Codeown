import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

export function useUserSavedProjects(userId: string | null, enabled: boolean = true) {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: ["userSavedProjects", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await api.get(`/projects/saved/${userId}`);
      const projectsData = Array.isArray(res.data) ? res.data : (res.data?.projects || res.data?.data || []);
      return projectsData;
    },
    enabled: !!userId && enabled,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const fetchUserSavedProjects = async () => {
    await queryClient.invalidateQueries({ queryKey: ["userSavedProjects", userId] });
  };

  return { projects, loading, fetchUserSavedProjects };
}
