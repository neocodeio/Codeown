import { useInfiniteQuery } from "@tanstack/react-query";
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

export function usePosts(limit: number = 20, filter: FeedFilter = "all", getToken?: () => Promise<string | null>, tag?: string, lang?: "en" | "ar") {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["posts", filter, tag, lang],
    queryFn: async ({ pageParam = 1 }) => {
      const token = getToken ? await getToken() : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = new URLSearchParams();
      params.append("page", (pageParam as number).toString());
      params.append("limit", limit.toString());
      if (filter && filter !== "all") params.append("filter", filter);
      if (tag) params.append("tag", tag);
      if (lang) params.append("lang", lang);

      const url = `/posts?${params.toString()}`;
      const res = await api.get(url, { headers });

      // Handle different response formats
      const postsData = res.data.posts || (Array.isArray(res.data) ? res.data : (res.data.data || []));

      return {
        posts: Array.isArray(postsData) ? postsData : [],
        total: res.data.total || 0,
        totalPages: res.data.totalPages || 1,
        page: pageParam as number
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  return {
    posts,
    loading: isLoading || isFetchingNextPage,
    fetchPosts: (_pageNum?: number, append: boolean = false) => append ? fetchNextPage() : refetch(),
    total: data?.pages[0]?.total || 0,
    totalPages: data?.pages[0]?.totalPages || 0,
    hasMore: hasNextPage,
    isRefetching: !isLoading && isFetchingNextPage
  };
}
