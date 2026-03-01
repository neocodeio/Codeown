import { useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import api from "../api/axios";

/** Cache times: 30min stale = no refetch on tab switch; 60min gc = keep in memory */
const FEED_STALE_TIME_MS = 1000 * 60 * 30;
const FEED_GC_TIME_MS = 1000 * 60 * 60;

export type FeedFilter = "all" | "following" | "contributors";

export function useProjects(limit: number = 10, filter: FeedFilter = "all", getToken?: () => Promise<string | null>, tag?: string, enabled: boolean = true) {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch,
    } = useInfiniteQuery({
        queryKey: ["projects", filter, tag ?? ""],
        enabled,
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
        staleTime: FEED_STALE_TIME_MS,
        gcTime: FEED_GC_TIME_MS,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    const projects = data?.pages.flatMap((page) => page.projects) || [];

    const fetchProjects = useCallback((_pageNum?: number, append: boolean = false) => {
        if (append) {
            fetchNextPage();
        } else {
            refetch();
        }
    }, [fetchNextPage, refetch]);

    return {
        projects,
        loading: isLoading || isFetchingNextPage,
        fetchProjects,
        total: data?.pages[0]?.total || 0,
        totalPages: data?.pages[0]?.totalPages || 0,
        hasMore: hasNextPage,
        isRefetching: !isLoading && isFetchingNextPage
    };
}
