import api from './axios.ts';
import type { Startup, JobPosting, StartupUpdate } from '../types/startup.ts';

export const getStartups = async (searchQuery?: string, status?: string) => {
    const { data } = await api.get<Startup[]>('/startups', {
        params: {
            searchQuery: searchQuery || undefined,
            status: (status && status !== 'All') ? status : undefined
        }
    });
    return data;
};

export const getStartup = async (id: string) => {
    const { data } = await api.get<Startup>(`/startups/${id}`);
    return data;
};

export const createStartup = async (startupData: Partial<Startup>) => {
    const { data } = await api.post<Startup>('/startups', startupData);
    return data;
};

export const updateStartup = async (id: string, startupData: Partial<Startup>) => {
    const { data } = await api.put<Startup>(`/startups/${id}`, startupData);
    return data;
};

export const getStartupMembers = async (id: string) => {
    const { data } = await api.get<{ 
        role: string; 
        user: { id: string; name: string; username: string; avatar_url: string | null } 
    }[]>(`/startups/${id}/members`);
    return data;
};

export const getStartupJobs = async (id: string) => {
    const { data } = await api.get<JobPosting[]>(`/startups/${id}/jobs`);
    return data;
};

export const getStartupUpdates = async (id: string) => {
    const { data } = await api.get<StartupUpdate[]>(`/startups/${id}/updates`);
    return data;
};

export const postStartupUpdate = async (id: string, content: string, is_broadcast: boolean) => {
    const { data } = await api.post<StartupUpdate>(`/startups/${id}/updates`, { content, is_broadcast });
    return data;
};

export const addStartupMember = async (id: string, username: string, role: string = 'Member') => {
    const { data } = await api.post(`/startups/${id}/members`, { username, role });
    return data;
};

export const removeStartupMember = async (id: string, userId: string) => {
    const { data } = await api.delete(`/startups/${id}/members/${userId}`);
    return data;
};

export const createStartupJob = async (id: string, jobData: any) => {
    const { data } = await api.post<JobPosting>(`/startups/${id}/jobs`, jobData);
    return data;
};

export const deleteStartupJob = async (id: string, jobId: string) => {
    const { data } = await api.delete(`/startups/${id}/jobs/${jobId}`);
    return data;
};

export interface CooldownStatus {
    isInCooldown: boolean;
    daysLeft: number;
    nextLaunchDate: string | null;
    lastLaunchDate?: string;
    diffMs?: number;
}

export const getCooldownStatus = async () => {
    const { data } = await api.get<CooldownStatus>('/startups/cooldown/status');
    return data;
};

export const upvoteStartup = async (id: string) => {
    const { data } = await api.post<{ success: boolean; upvotes_count: number; has_upvoted: boolean }>(`/startups/${id}/upvote`);
    return data;
};

