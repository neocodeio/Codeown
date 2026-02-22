import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import type { Project } from "../types/project";
import { formatRelativeDate } from "../utils/date";

export default function RecentProjectLaunches() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecentProjects = async () => {
            try {
                const response = await api.get("/projects?limit=5");
                const projectsData = response.data.projects || (Array.isArray(response.data) ? response.data : (response.data.data || []));
                setProjects(projectsData.slice(0, 5));
            } catch (error) {
                console.error("Failed to fetch recent projects", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentProjects();
    }, []);

    if (loading) {
        return (
            <div style={{
                backgroundColor: "#fff",
                borderRadius: "32px",
                border: "1px solid #e2e8f0",
                padding: "32px",
                marginTop: "20px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
            }}>
                <div style={{ width: "150px", height: "18px", backgroundColor: "#f1f5f9", borderRadius: "4px", marginBottom: "24px" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} style={{ display: "flex", gap: "12px" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "#f1f5f9" }} />
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                                <div style={{ width: "80%", height: "14px", backgroundColor: "#f1f5f9", borderRadius: "4px" }} />
                                <div style={{ width: "40%", height: "12px", backgroundColor: "#f1f5f9", borderRadius: "4px" }} />
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
            backgroundColor: "#fff",
            borderRadius: "32px",
            border: "1px solid #e2e8f0",
            padding: "32px",
            marginTop: "20px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
        }}>
            <style>{`
                .project-launch-item:hover .project-launch-title {
                    color: #10633b !important;
                }
            `}</style>
            <h3 style={{
                fontSize: "20px",
                fontWeight: 900,
                color: "#0f172a",
                margin: "0 0 24px 0",
                letterSpacing: "-0.04em",
                lineHeight: 1.1
            }}>
                Recent Launches
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            backgroundColor: "#f1f5f9",
                            flexShrink: 0,
                            border: "1px solid #eff3f4"
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
                                    fontSize: "18px"
                                }}>
                                    🚀
                                </div>
                            )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                            <span
                                className="project-launch-title"
                                style={{
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    transition: "color 0.2s"
                                }}
                            >
                                {project.title}
                            </span>
                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                                by {project.user?.name || "Unknown"} • {formatRelativeDate(project.created_at)}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>

            <Link
                to="/?type=projects"
                style={{
                    display: "block",
                    marginTop: "24px",
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "#0f172a",
                    textDecoration: "none",
                    transition: "opacity 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
                Show more &rarr;
            </Link>
        </div>
    );
}
