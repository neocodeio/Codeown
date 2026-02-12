import { useInfiniteQuery } from "@tanstack/react-query";
import api from "../api/axios";

export type FeedFilter = "all" | "following" | "contributors";

export function useProjects(limit: number = 20, filter: FeedFilter = "all", getToken?: () => Promise<string | null>, tag?: string) {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch,
    } = useInfiniteQuery({
        queryKey: ["projects", filter, tag],
        queryFn: async ({ pageParam = 1 }) => {
            const token = getToken ? await getToken() : null;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const params = new URLSearchParams();
            params.append("page", (pageParam as number).toString());
            params.append("limit", limit.toString());
            if (filter && filter !== "all") params.append("filter", filter);
            if (tag) params.append("tag", tag);

            const res = await api.get(`/projects?${params.toString()}`, { headers });

            const projectsData = res.data.projects || (Array.isArray(res.data) ? res.data : (res.data.data || []));

            return {
                projects: Array.isArray(projectsData) ? projectsData : [],
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

    const projects = data?.pages.flatMap((page) => page.projects) || [];

    return {
        projects,
        loading: isLoading || isFetchingNextPage,
        fetchProjects: (_pageNum?: number, append: boolean = false) => append ? fetchNextPage() : refetch(),
        total: data?.pages[0]?.total || 0,
        totalPages: data?.pages[0]?.totalPages || 0,
        hasMore: hasNextPage,
        isRefetching: isLoading && !isFetchingNextPage
    };
}
