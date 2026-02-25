import { useState, useEffect } from "react";
import { useClerkAuth } from "./useClerkAuth";
import { useClerkUser } from "./useClerkUser";
import api from "../api/axios";

export function useProjectSaved(projectId: number, initialIsSaved?: boolean) {
  const [isSaved, setIsSaved] = useState(initialIsSaved ?? false);
  const [loading, setLoading] = useState(false);
  const { getToken } = useClerkAuth();
  const { user } = useClerkUser();

  // Sync with initial values if they change
  useEffect(() => {
    if (initialIsSaved !== undefined) {
      setIsSaved(initialIsSaved);
    }
  }, [initialIsSaved]);

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
    // If initial value is provided, don't fetch redundantly
    if (initialIsSaved !== undefined) return;

    if (projectId && user) {
      fetchSavedStatus();
    }
  }, [projectId, user, initialIsSaved]);

  return { isSaved, loading, toggleSave, fetchSavedStatus };
}
