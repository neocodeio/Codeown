import { useState, useEffect } from "react";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";

export function useFollow(userId: string | null) {
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { getToken } = useClerkAuth();

  const fetchFollowStatus = async () => {
    if (!userId) return;
    
    try {
      const token = await getToken();
      const res = await api.get(`/follows/${userId}/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setFollowing(res.data.following || false);
      setFollowers(res.data.followers || 0);
      setFollowingCount(res.data.following || 0);
    } catch (error) {
      console.error("Error fetching follow status:", error);
    }
  };

  useEffect(() => {
    fetchFollowStatus();
  }, [userId]);

  const toggleFollow = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        alert("Please sign in to follow users");
        setLoading(false);
        return;
      }

      const res = await api.post(
        `/follows/${userId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setFollowing(res.data.following);
      if (res.data.following) {
        setFollowers((prev) => prev + 1);
      } else {
        setFollowers((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to follow user";
      alert(`Failed to follow user: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return { following, followers, followingCount, loading, toggleFollow, fetchFollowStatus };
}
