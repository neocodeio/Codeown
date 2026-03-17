import { useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import FeedPostComposer from "../components/FeedPostComposer";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";

import { usePosts, type FeedFilter } from "../hooks/usePosts";
import { useProjects } from "../hooks/useProjects";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import { PostCardSkeleton } from "../components/LoadingSkeleton";
import { SEO } from "../components/SEO";


export default function Feed() {
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const isDesktop = width >= 1100;
    const [searchParams, setSearchParams] = useSearchParams();

    // Sync state with URL params
    const feedType = (searchParams.get("type") as "posts" | "projects") || "posts";
    const feedFilter = (searchParams.get("filter") as FeedFilter) || "all";
    const selectedTag = searchParams.get("tag") || "";
    const selectedLang = (searchParams.get("lang") as "en" | "ar" | "") || "";

    // Helper to update search params
    const updateParams = (newParams: Record<string, string | null>) => {
        setSearchParams(prev => {
            if (newParams.type && newParams.type !== feedType) {
                prev.delete("tag");
                prev.delete("lang");
            }
            Object.entries(newParams).forEach(([key, value]) => {
                if (value === null || value === "") prev.delete(key);
                else prev.set(key, value);
            });
            return prev;
        }, { replace: true });
    };

    const handleFilterChange = (filter: FeedFilter) => updateParams({ filter });

    const { getToken } = useClerkAuth();

    const {
        posts,
        loading: postsLoading,
        fetchPosts,
        hasMore: postsHasMore
    } = usePosts(10, feedFilter, getToken, selectedTag, selectedLang || undefined, true);

    const {
        projects,
        loading: projectsLoading,
        fetchProjects,
        hasMore: projectsHasMore
    } = useProjects(10, feedFilter, getToken, selectedTag, true);

    const loading = feedType === "posts" ? postsLoading : projectsLoading;
    const hasMore = feedType === "posts" ? postsHasMore : projectsHasMore;

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
                if (hasMore && !loading) {
                    if (feedType === "posts") fetchPosts(undefined, true);
                    else fetchProjects(undefined, true);
                }
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [hasMore, loading, fetchPosts, fetchProjects, feedType]);

    const currentItems = feedType === "posts" ? posts : projects;

    const handlePostCreated = useCallback(() => fetchPosts(undefined, false), [fetchPosts]);
    const handleProjectCreated = useCallback(() => fetchProjects(undefined, false), [fetchProjects]);

    useEffect(() => {
        window.addEventListener("postCreated", handlePostCreated);
        window.addEventListener("projectCreated", handleProjectCreated);
        return () => {
            window.removeEventListener("postCreated", handlePostCreated);
            window.removeEventListener("projectCreated", handleProjectCreated);
        };
    }, [handlePostCreated, handleProjectCreated]);

    const isInitialLoading = (feedType === "posts" && postsLoading && posts.length === 0) ||
        (feedType === "projects" && projectsLoading && projects.length === 0);

    return (
        <main style={{ padding: 0, backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
            <SEO title="Discover" description="Connect with builders worldwide." />

            <div style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                maxWidth: "1100px",
                margin: "0 auto",
                padding: isDesktop ? "0 20px" : "0",
            }}>
                {/* ── Main Feed Column ── */}
                <div style={{
                    width: isDesktop ? "var(--feed-width)" : "100%",
                    flexShrink: 0,
                    border: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
                    minHeight: "100vh",
                    position: "relative",
                    backgroundColor: "var(--bg-page)"
                }}>

                    {/* ── Minimal Apple-Style Header ── */}
                    <div style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 100,
                        backgroundColor: "var(--bg-page)",
                        borderBottom: "0.5px solid var(--border-hairline)",
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            height: "64px",
                            padding: "0 24px",
                            gap: "8px"
                        }}>
                            {/* Tabs Column */}
                            <div style={{
                                display: "flex",
                                gap: isMobile ? "16px" : "28px",
                                height: "100%",
                                overflowX: "auto",
                                scrollbarWidth: "none"
                            }} className="no-scrollbar">
                                {[
                                    { id: "all", label: "Discover" },
                                    { id: "following", label: "Following" }
                                ].map((tab) => (
                                    <h1 key={tab.id} style={{ margin: 0, padding: 0, height: "100%", display: "flex", alignItems: "center" }}>
                                        <button
                                            onClick={() => handleFilterChange(tab.id as any)}
                                            aria-label={`Switch to ${tab.label} feed`}
                                            style={{
                                                background: "none", border: "none", padding: "0",
                                                height: "100%", position: "relative", cursor: "pointer",
                                                fontSize: "12px",
                                                fontWeight: feedFilter === tab.id ? "600" : "500",
                                                color: feedFilter === tab.id ? "var(--text-primary)" : "var(--text-tertiary)",
                                                transition: "all 0.15s ease",
                                                whiteSpace: "nowrap",
                                                fontFamily: "var(--font-mono)",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.1em"
                                            }}
                                        >
                                            {tab.label}
                                            {feedFilter === tab.id && (
                                                <div style={{
                                                    position: "absolute", bottom: "-0.5px", left: 0, right: 0,
                                                    height: "1px", backgroundColor: "var(--text-primary)",
                                                }} />
                                            )}
                                        </button>
                                    </h1>
                                ))}
                            </div>

                            {/* Feed Type Switcher */}
                            <div style={{ display: "flex", gap: "2px", flexShrink: 0, backgroundColor: "var(--bg-input)", padding: "3px", borderRadius: "2px", border: "0.5px solid var(--border-hairline)" }}>
                                <button
                                    onClick={() => updateParams({ type: "posts" })}
                                    aria-label="View Posts Feed"
                                    style={{
                                        background: feedType === "posts" ? "var(--text-primary)" : "none",
                                        border: "none",
                                        padding: "8px 16px",
                                        borderRadius: "1px",
                                        fontSize: "11px",
                                        fontWeight: "800",
                                        fontFamily: "var(--font-mono)",
                                        color: feedType === "posts" ? "var(--bg-page)" : "var(--text-tertiary)",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em"
                                    }}
                                >
                                    Posts
                                </button>
                                <button
                                    onClick={() => updateParams({ type: "projects" })}
                                    aria-label="View Projects Feed"
                                    style={{
                                        background: feedType === "projects" ? "var(--text-primary)" : "none",
                                        border: "none",
                                        padding: "8px 16px",
                                        borderRadius: "1px",
                                        fontSize: "11px",
                                        fontWeight: "800",
                                        fontFamily: "var(--font-mono)",
                                        color: feedType === "projects" ? "var(--bg-page)" : "var(--text-tertiary)",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em"
                                    }}
                                >
                                    Projects
                                </button>
                            </div>
                        </div>

                        {feedType === "projects" && (
                            <div style={{
                                display: "flex",
                                gap: "10px",
                                padding: "12px 24px",
                                overflowX: "auto",
                                borderTop: "0.5px solid var(--border-hairline)",
                                backgroundColor: "var(--bg-page)"
                            }} className="no-scrollbar">
                                {["All", "React", "TypeScript", "Next.js", "Node.js", "Python", "Tailwind"].map(tag => {
                                    const isSelected = (tag === "All" && !selectedTag) || selectedTag === tag;
                                    return (
                                        <button
                                            key={tag}
                                            onClick={() => updateParams({ tag: tag === "All" ? null : tag })}
                                            aria-label={`Filter by ${tag}`}
                                            style={{
                                                flexShrink: 0, padding: "8px 16px", borderRadius: "2px",
                                                border: "0.5px solid",
                                                borderColor: isSelected ? "var(--text-primary)" : "var(--border-hairline)",
                                                backgroundColor: isSelected ? "var(--text-primary)" : "transparent",
                                                color: isSelected ? "var(--bg-page)" : "var(--text-secondary)",
                                                fontSize: "12px", fontWeight: "700", cursor: "pointer",
                                                transition: "all 0.15s ease",
                                                fontFamily: "var(--font-mono)",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em"
                                            }}
                                        >
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Content ── */}
                    <div style={{ minHeight: "100vh" }}>
                        {feedType === "posts" && (
                            <div style={{ borderBottom: "0.5px solid var(--border-hairline)" }}>
                                <FeedPostComposer onCreated={handlePostCreated} />
                            </div>
                        )}

                        {isInitialLoading ? (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} style={{ padding: isMobile ? "24px 16px" : "32px", borderBottom: "1px solid #f1f5f9" }}>
                                        <PostCardSkeleton />
                                    </div>
                                ))}
                            </div>
                        ) : currentItems.length === 0 && !loading ? (
                            <div style={{ padding: "120px 24px", textAlign: "center" }}>
                                <div style={{ marginBottom: "20px", fontSize: "32px", opacity: 0.1 }}>🧊</div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px", letterSpacing: "0.05em", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Quiet in here</h3>
                                <p style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>Be the first to share something amazing with the community.</p>
                            </div>
                        ) : (
                            <div>
                                {feedType === "posts"
                                    ? (currentItems as any[]).map(p => (
                                        <div key={p.id} style={{ borderBottom: "0.5px solid var(--border-hairline)" }}>
                                            <PostCard post={p} onUpdated={() => fetchPosts(undefined, false)} />
                                        </div>
                                    ))
                                    : (currentItems as any[]).map(p => (
                                        <div key={p.id} style={{ borderBottom: "0.5px solid var(--border-hairline)" }}>
                                            <ProjectCard project={p} onUpdated={() => fetchProjects(undefined, false)} />
                                        </div>
                                    ))
                                }
                                {loading && <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "12px", fontWeight: "600", fontFamily: "var(--font-mono)" }}>LOADING...</div>}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right Sidebar ── */}
                {isDesktop && (
                    <aside style={{
                        width: "340px",
                        paddingLeft: "12px",
                        position: "sticky",
                        top: 0,
                        alignSelf: "flex-start",
                        flexShrink: 0,
                        zIndex: 1,
                    }}>
                        <RecommendedUsersSidebar />
                    </aside>
                )}
            </div>
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            {/* ── SEO Rich Content (Addressing Thin Content) ── */}
            <section style={{ 
                maxWidth: "1100px", 
                margin: "40px auto 100px", 
                padding: "0 24px",
                borderTop: "0.5px solid var(--border-hairline)",
                paddingTop: "60px"
            }}>
                <h2 style={{ 
                    fontSize: "24px", 
                    fontWeight: 800, 
                    color: "var(--text-primary)", 
                    marginBottom: "32px",
                    letterSpacing: "-0.02em"
                }}>
                    BUILDING THE FUTURE OF DEVELOPER COMMUNITIES
                </h2>
                
                <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
                    gap: "40px",
                    lineHeight: 1.8,
                    color: "var(--text-secondary)",
                    fontSize: "15px"
                }}>
                    <div>
                        <p style={{ marginBottom: "20px" }}>
                            Codeown is more than just a portfolio platform; it's a living ecosystem designed for the modern engineer. 
                            In a digital landscape often cluttered with noise, we've carved out a space specifically for those 
                            who love the craft of building. Our mission is to bridge the gap between code and community, 
                            providing tools that not only showcase your work but also foster meaningful collaboration.
                        </p>
                        <p style={{ marginBottom: "20px" }}>
                            Whether you're a seasoned architect or an emerging developer, Codeown offers a streamlined interface 
                            to document your journey. By focusing on project-centric sharing, we allow your technical achievements 
                            to speak for themselves. Our unique 'Pulse' system and real-time streaks gamify the experience of 
                            daily contribution, encouraging consistent growth and platform engagement.
                        </p>
                    </div>
                    <div>
                        <p style={{ marginBottom: "20px" }}>
                            The platform's architecture is built on the principles of speed, accessibility, and high visual standards. 
                            We believe that a developer's digital home should be as refined as the code they write. This is why 
                            Codeown prioritizes a dark-mode first design, sleek micro-animations, and a layout that respects the 
                            hierarchy of your projects.
                        </p>
                        <p style={{ marginBottom: "20px" }}>
                            Join a global network of innovators who are sharing everything from weekend hacks to production-grade 
                            systems. On Codeown, every upvote and comment is a sign of technical validation. We are committed to 
                            helping you build your professional identity, find potential co-founders, and stay inspired by the 
                            best works of your peers. Welcome to the home of passionate developers.
                        </p>
                    </div>
                </div>

                {/* Hidden rich metadata for deep indexing */}
                <div style={{ display: "none" }}>
                    <h3>Comprehensive Features for Modern Developers</h3>
                    <p>
                        Codeown provides advanced project management features where users can upload multiple images, 
                        link their GitHub repositories, and provide detailed technical documentation for their builds. 
                        Our real-time messaging system allows for immediate collaboration, while the global leaderboard 
                        highlights the most active and influential developers in the ecosystem. Every project on Codeown 
                        is automatically optimized for SEO, ensuring that your work is discoverable by recruiters and 
                        fellow builders across the web. The 'Developer ID Card' feature provides a portable digital 
                        identity that summarizes your tech stack, experience, and community impact.
                    </p>
                    <h3>Technical Stack and Community Standards</h3>
                    <p>
                        Built with a modern stack including React, Supabase, and Node.js, Codeown is engineered for 
                        maximum performance. We maintain high standards of community behavior, ensuring that the 
                        platform remains a focused, supportive environment for technical discussion. Our discovery 
                        algorithms prioritize high-quality project builds and valuable community insights, making 
                        it easier for unique projects to gain the visibility they deserve.
                    </p>
                </div>
            </section>
        </main>
    );
}
