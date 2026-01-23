import { useState, useEffect } from "react";
import { useClerkAuth } from "./useClerkAuth";
import api from "../api/axios";
import type { Project } from "../types/project";

export function useUserSavedProjects(userId: string | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useClerkAuth();

  const fetchUserSavedProjects = async () => {
    if (!userId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      const response = await api.get(`/users/${userId}/saved-projects`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setProjects(response.data || []);
    } catch (error) {
      console.error("Error fetching user saved projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSavedProjects();
  }, [userId]);

  return { projects, loading, fetchUserSavedProjects };
}
