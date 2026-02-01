import { useState, useEffect } from "react";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";

export function useSaved(postId: number | null, initialIsSaved?: boolean) {
  const [isSaved, setIsSaved] = useState(initialIsSaved ?? false);
  const [loading, setLoading] = useState(false);
  const { getToken, isLoaded, userId } = useClerkAuth();

  // Sync with initial values if they change
  useEffect(() => {
    if (initialIsSaved !== undefined) {
      setIsSaved(initialIsSaved);
    }
  }, [initialIsSaved]);

  const fetchSavedStatus = async () => {
    if (!postId || !userId || !isLoaded) return;

    try {
      const token = await getToken();
      if (!token) return;

      const res = await api.get(`/saved/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsSaved(res.data.saved || res.data.isSaved || false);
    } catch (error) {
      console.error("Error fetching saved status:", error);
    }
  };

  useEffect(() => {
    fetchSavedStatus();
  }, [postId, userId, isLoaded]);

  const toggleSave = async () => {
    if (!postId) return;

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        alert("Please sign in to save posts");
        setLoading(false);
        return;
      }

      const res = await api.post(
        `/saved/${postId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setIsSaved(res.data.saved || res.data.isSaved || false);
    } catch (error) {
      console.error("Error toggling save:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save post";
      alert(`Failed to save post: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return { isSaved, loading, toggleSave, fetchSavedStatus };
}
