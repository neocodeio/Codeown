import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

export function useUserProjects(userId: string | null) {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: ["userProjects", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await api.get(`/projects/user/${userId}`);
      const projectsData = Array.isArray(res.data) ? res.data : (res.data?.projects || res.data?.data || []);
      return projectsData;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const fetchUserProjects = async () => {
    await queryClient.invalidateQueries({ queryKey: ["userProjects", userId] });
  };

  return { projects, loading, fetchUserProjects };
}
