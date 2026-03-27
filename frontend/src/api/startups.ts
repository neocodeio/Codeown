import api from './axios.ts';
import type { Startup, StartupMember, JobPosting, StartupUpdate } from '../types/startup.ts';

export const getStartups = async (searchQuery?: string, status?: string) => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('searchQuery', searchQuery);
    if (status && status !== 'All') params.append('status', status);
    const { data } = await api.get<Startup[]>(`/startups?${params.toString()}`);
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
    const { data } = await api.get<{ role: string; user: any }[]>(`/startups/${id}/members`);
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
