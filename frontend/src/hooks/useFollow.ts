import { useState, useEffect } from "react";
import api from "../api/axios";
import { useClerkAuth } from "./useClerkAuth";

export function useFollow(userId: string | null) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
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
      setIsFollowing(res.data.isFollowing || false);
      setFollowerCount(res.data.followerCount || 0);
      setFollowingCount(res.data.followingCount || 0);
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

      setIsFollowing(res.data.following);
      setFollowerCount(res.data.followerCount || (res.data.following ? followerCount + 1 : Math.max(0, followerCount - 1)));
    } catch (error) {
      console.error("Error toggling follow:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to follow user";
      alert(`Failed to follow user: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return { isFollowing, followerCount, followingCount, loading, toggleFollow, fetchFollowStatus };
}
