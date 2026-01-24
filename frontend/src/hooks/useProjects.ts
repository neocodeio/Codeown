import { useEffect, useState } from "react";
import api from "../api/axios";
import type { Project } from "../types/project";

export type FeedFilter = "all" | "following" | "contributors";

export function useProjects(page: number = 1, limit: number = 20, filter: FeedFilter = "all", getToken?: () => Promise<string | null>) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const fetchProjects = async (pageNum: number = page, append: boolean = false) => {
        setLoading(true);
        try {
            const token = getToken ? await getToken() : null;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            let filterParam = "";
            if (filter === "following") filterParam = "&filter=following";
            else if (filter === "contributors") filterParam = "&filter=contributors";

            const res = await api.get(`/projects?page=${pageNum}&limit=${limit}${filterParam}`, { headers });

            let projectsData: Project[] = [];

            if (res.data.projects) {
                // Paginated response
                projectsData = Array.isArray(res.data.projects) ? res.data.projects : [];
                setTotal(res.data.total || 0);
                setTotalPages(res.data.totalPages || 0);
                setHasMore(pageNum < (res.data.totalPages || 0));
            } else if (Array.isArray(res.data)) {
                // Legacy response
                projectsData = res.data;
            }

            if (!Array.isArray(projectsData)) {
                projectsData = [];
            }

            if (append) {
                setProjects((prev) => [...prev, ...projectsData]);
            } else {
                setProjects(projectsData);
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects(page, false);
    }, [page, filter]);

    return { projects, loading, fetchProjects, total, totalPages, hasMore };
}
