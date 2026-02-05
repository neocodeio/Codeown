import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";

export interface Post {
  id: number;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  images?: string[] | null;
  tags?: string[] | null;
  like_count?: number;
  comment_count?: number;
  user?: {
    name: string;
    email: string | null;
    avatar_url?: string | null;
    username?: string | null;
  };
  isLiked?: boolean;
  isSaved?: boolean;
  view_count?: number;
  language?: "en" | "ar";
}

export type FeedFilter = "all" | "following" | "contributors";

export function usePosts(page: number = 1, limit: number = 20, filter: FeedFilter = "all", getToken?: () => Promise<string | null>, tag?: string, lang?: "en" | "ar") {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (pageNum: number = page, append: boolean = false) => {
    setLoading(true);
    try {
      const token = getToken ? await getToken() : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      // Construct query parameters cleanly
      const params = new URLSearchParams();
      params.append("page", pageNum.toString());
      params.append("limit", limit.toString());
      if (filter && filter !== "all") params.append("filter", filter);
      if (tag) params.append("tag", tag);
      if (lang) params.append("lang", lang);

      const url = `/posts?${params.toString()}`;
      const res = await api.get(url, { headers });
      let postsData: Post[] = [];

      if (res.data.posts) {
        // Paginated response
        postsData = Array.isArray(res.data.posts) ? res.data.posts : [];
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 0);
        setHasMore(pageNum < (res.data.totalPages || 0));
      } else if (Array.isArray(res.data)) {
        // Legacy response (array)
        postsData = res.data;
      } else {
        // Fallback: try to extract posts from response
        postsData = res.data?.data || res.data?.posts || [];
      }

      // Ensure postsData is always an array
      if (!Array.isArray(postsData)) {
        postsData = [];
      }

      if (append) {
        setPosts((prev) => [...prev, ...postsData]);
      } else {
        setPosts(postsData);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filter, getToken, tag, lang]);

  useEffect(() => {
    fetchPosts(page, false);
  }, [page, filter, tag, lang, getToken]);

  return { posts, loading, fetchPosts, total, totalPages, hasMore };
}