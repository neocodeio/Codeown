import { useState, useEffect } from 'react';
import api from '../api/axios';

interface AvatarCache {
    [userId: string]: string | null;
}

// Global cache to store avatars across components
const avatarCache: AvatarCache = {};

/**
 * Custom hook to get and cache user avatars
 * This ensures consistent avatar display across the entire app
 * 
 * @param userId - The user's ID
 * @param fallbackUrl - Optional fallback URL (e.g., Clerk's imageUrl)
 * @param userName - User's name for generating placeholder avatar
 * @returns The avatar URL to use
 */
export function useAvatar(userId: string | undefined, fallbackUrl?: string | null | undefined, userName?: string) {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        // Check cache first
        if (avatarCache[userId] !== undefined) {
            setAvatarUrl(avatarCache[userId]);
            setLoading(false);
            return;
        }

        // Fetch from API
        const fetchAvatar = async () => {
            try {
                const res = await api.get(`/users/${userId}`);
                const dbAvatarUrl = res.data?.avatar_url || null;

                // Cache the result
                avatarCache[userId] = dbAvatarUrl;
                setAvatarUrl(dbAvatarUrl);
            } catch (error) {
                console.error('Error fetching avatar:', error);
                // Cache null to avoid repeated failed requests
                avatarCache[userId] = null;
                setAvatarUrl(null);
            } finally {
                setLoading(false);
            }
        };

        fetchAvatar();
    }, [userId]);

    // Return priority: DB avatar > fallback > generated placeholder
    const finalUrl = avatarUrl || fallbackUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=212121&color=ffffff&bold=true`;

    return { avatarUrl: finalUrl, loading };
}

/**
 * Get avatar URL synchronously (for cases where you already have the data)
 * 
 * @param dbAvatarUrl - Avatar URL from database
 * @param fallbackUrl - Fallback URL (e.g., Clerk's imageUrl)
 * @param userName - User's name for placeholder
 * @returns The avatar URL to use
 */
export function getAvatarUrl(dbAvatarUrl?: string | null, fallbackUrl?: string | null, userName?: string): string {
    return dbAvatarUrl || fallbackUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=212121&color=ffffff&bold=true`;
}

/**
 * Update the avatar cache when a user updates their profile
 * Call this after successful avatar upload
 */
export function updateAvatarCache(userId: string, newAvatarUrl: string | null) {
    avatarCache[userId] = newAvatarUrl;
}

/**
 * Clear avatar cache for a specific user or all users
 */
export function clearAvatarCache(userId?: string) {
    if (userId) {
        delete avatarCache[userId];
    } else {
        Object.keys(avatarCache).forEach(key => delete avatarCache[key]);
    }
}
