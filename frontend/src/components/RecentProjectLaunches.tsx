
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { formatRelativeDate } from "../utils/date";

export default function RecentProjectLaunches() {
    const { data: projects = [], isLoading: loading } = useQuery({
        queryKey: ["recentProjects", "sidebar"],
        queryFn: async () => {
            const response = await api.get("/projects?limit=5");
            const projectsData = response.data.projects || (Array.isArray(response.data) ? response.data : (response.data.data || []));
            return projectsData.slice(0, 5);
        },
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    if (loading) {
        return (
            <div style={{
                backgroundColor: "var(--bg-card)",
                border: "0.5px solid var(--border-hairline)",
                padding: "24px",
                marginTop: "20px",
            }}>
                <div style={{ width: "120px", height: "14px", backgroundColor: "var(--bg-hover)", borderRadius: "2px", marginBottom: "20px" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} style={{ display: "flex", gap: "12px" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "2px", backgroundColor: "var(--bg-hover)" }} />
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                                <div style={{ width: "70%", height: "10px", backgroundColor: "var(--bg-hover)", borderRadius: "1px" }} />
                                <div style={{ width: "30%", height: "8px", backgroundColor: "var(--bg-hover)", borderRadius: "1px" }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (projects.length === 0) return null;

    return (
        <div style={{
            backgroundColor: "var(--bg-card)",
            border: "0.5px solid var(--border-hairline)",
            padding: "24px",
            marginTop: "12px",
            marginBottom: "24px",
        }}>
            <style>{`
                .project-launch-item:hover .project-launch-title {
                    text-decoration: underline;
                }
            `}</style>
            <h3 style={{
                fontSize: "13px",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: "0 0 20px 0",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "var(--font-mono)"
            }}>
                Recent Launches
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {projects.map(project => (
                    <Link
                        key={project.id}
                        to={`/project/${project.id}`}
                        style={{
                            display: "flex",
                            gap: "12px",
                            textDecoration: "none"
                        }}
                        className="project-launch-item"
                    >
                        <div style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "2px",
                            overflow: "hidden",
                            backgroundColor: "var(--bg-hover)",
                            flexShrink: 0,
                            border: "0.5px solid var(--border-hairline)"
                        }}>
                            {project.cover_image ? (
                                <img
                                    src={project.cover_image}
                                    alt={project.title}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <div style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "14px"
                                }}>
                                    🚀
                                </div>
                            )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, justifyContent: "center" }}>
                            <span
                                className="project-launch-title"
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    textTransform: "uppercase",
                                    letterSpacing: "-0.01em"
                                }}
                            >
                                {project.title}
                            </span>
                            <span style={{ fontSize: "10px", color: "var(--text-tertiary)", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                                {formatRelativeDate(project.created_at).toUpperCase()}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>

            <Link
                to="/?type=projects"
                style={{
                    display: "block",
                    marginTop: "20px",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    textDecoration: "none",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
                View all launches &rarr;
            </Link>
        </div>
    );
}
