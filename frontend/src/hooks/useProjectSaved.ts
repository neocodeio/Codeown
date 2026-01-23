import { useState, useEffect } from "react";
import { useClerkAuth } from "./useClerkAuth";
import { useClerkUser } from "./useClerkUser";
import api from "../api/axios";

export function useProjectSaved(projectId: number) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const { getToken } = useClerkAuth();
  const { user } = useClerkUser();

  const fetchSavedStatus = async () => {
    if (!user || !projectId) return;
    
    try {
      const token = await getToken();
      if (!token) return;
      
      const response = await api.get(`/projects/${projectId}/save`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsSaved(response.data.isSaved);
    } catch (error) {
      console.error("Error fetching saved status:", error);
    }
  };

  const toggleSave = async () => {
    if (!user) {
      // Redirect to sign in or show sign in modal
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.post(
        `/projects/${projectId}/save`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsSaved(response.data.isSaved);
    } catch (error) {
      console.error("Error toggling save:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && user) {
      fetchSavedStatus();
    }
  }, [projectId, user]);

  return { isSaved, loading, toggleSave, fetchSavedStatus };
}
