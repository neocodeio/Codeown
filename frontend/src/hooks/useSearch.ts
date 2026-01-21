import { useState, useEffect } from "react";
import api from "../api/axios";
import { useDebounce } from "./useDebounce";

export interface SearchUser {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface SearchPost {
  id: number;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  tags?: string[] | null;
  user?: {
    name: string;
    email: string | null;
    avatar_url?: string | null;
  };
}

export function useSearch() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setUsers([]);
      setPosts([]);
      setShowResults(false);
    }
  }, [debouncedQuery]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/search/all?q=${encodeURIComponent(searchQuery)}`);
      setUsers(res.data.users || []);
      setPosts(res.data.posts || []);
      setShowResults(true);
    } catch (error) {
      console.error("Error searching:", error);
      setUsers([]);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setUsers([]);
    setPosts([]);
    setShowResults(false);
  };

  return {
    query,
    setQuery,
    users,
    posts,
    loading,
    showResults,
    setShowResults,
    clearSearch,
  };
}
