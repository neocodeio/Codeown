import { useState, useEffect } from "react";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";

export function useSaved(postId: number | null) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const { getToken, isLoaded } = useClerkAuth();

  const fetchSavedStatus = async () => {
    if (!postId || !isLoaded) return;
    
    try {
      const token = await getToken();
      if (!token) return;

      const res = await api.get(`/saved/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsSaved(res.data.saved || false);
    } catch (error) {
      console.error("Error fetching saved status:", error);
    }
  };

  useEffect(() => {
    fetchSavedStatus();
  }, [postId, isLoaded]);

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

      setIsSaved(res.data.saved);
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
