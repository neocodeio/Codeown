import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useClerkAuth } from './useClerkAuth';

export interface Article {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  cover_image: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  saves_count: number;
  comments_count: number;
  liked?: boolean;
  saved?: boolean;
  users: {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
    is_pro: boolean;
    is_og: boolean;
  };
}

export function useUserArticles(userId: string | null, immediate = true) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const { getToken } = useClerkAuth();

  const fetchUserArticles = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res = await api.get(`/articles?userId=${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setArticles(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching user articles:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, getToken]);

  useEffect(() => {
    if (immediate && userId) {
      fetchUserArticles();
    }
  }, [userId, immediate, fetchUserArticles]);

  return { articles, loading, fetchUserArticles };
}
