import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import api from "../api/axios";
import type { Project, ProjectFormData } from "../types/project";
import { X, Check, GithubLogo } from "phosphor-react";
import { validateImageSize } from "../constants/upload";
import { toast } from "react-toastify";
import { useActivityBroadcast } from "../hooks/useActivityBroadcast";

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
    project?: Project | null;
}

export default function ProjectModal({ isOpen, onClose, onUpdated, project }: ProjectModalProps) {
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const { getToken } = useClerkAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [techInput, setTechInput] = useState("");
    const [fetchingGitHub, setFetchingGitHub] = useState(false);
    const { announce } = useActivityBroadcast();

    const [formData, setFormData] = useState<ProjectFormData>({
        title: "",
        description: "",
        technologies_used: [],
        status: "in_progress",
        github_repo: "",
        live_demo: "",
        cover_image: "",
        project_details: "",
        founder_vision: "",
        contributors: [],
    });


    useEffect(() => {
        if (project) {
            setFormData({
                title: project.title,
                description: project.description,
                technologies_used: project.technologies_used,
                status: project.status,
                github_repo: project.github_repo || "",
                live_demo: project.live_demo || "",
                cover_image: project.cover_image || "",
                project_details: project.project_details,
                founder_vision: project.founder_vision || "",
                contributors: (project.contributors || []).map(c => c.username),
            });
        } else {
            setFormData({
                title: "",
                description: "",
                technologies_used: [],
                status: "in_progress",
                github_repo: "",
                live_demo: "",
                cover_image: "",
                project_details: "",
                founder_vision: "",
                contributors: [],
            });
        }
        setTechInput("");
        setError("");
    }, [project, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (!project) announce("launching");
    };

    const handleAddTech = () => {
        if (techInput.trim() && !formData.technologies_used.includes(techInput.trim())) {
            setFormData(prev => ({
                ...prev,
                technologies_used: [...prev.technologies_used, techInput.trim()]
            }));
            setTechInput("");
        }
    };

    const handleRemoveTech = (techToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            technologies_used: prev.technologies_used.filter(tech => tech !== techToRemove)
        }));
    };


    const handleGitHubImport = async () => {
        const repoUrl = (formData.github_repo || "").trim();
        if (!repoUrl) {
            setError("Please enter a GitHub repository URL first.");
            return;
        }

        // Simple regex to extract owner and repo from various GitHub URL formats
        const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) {
            setError("Invalid GitHub URL. Format: https://github.com/owner/repo");
            return;
        }

        const owner = match[1];
        const repo = match[2].replace(/\.git$/, "");

        setFetchingGitHub(true);
        setError("");

        try {
            // Fetch basic repo info
            const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
            if (!repoRes.ok) throw new Error("Repository not found or private.");
            const repoData = await repoRes.json();

            // Fetch languages (for tech stack)
            const languagesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
            const languagesData = await languagesRes.json();
            const languages = Object.keys(languagesData).slice(0, 5); // Take top 5 languages

            // Fetch README content
            const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
                headers: { Accept: "application/vnd.github.raw" }
            });
            let readmeContent = "";
            if (readmeRes.ok) {
                readmeContent = await readmeRes.text();
            }

            // Update form data
            setFormData(prev => ({
                ...prev,
                title: prev.title || repoData.name.split(/[-_]/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
                description: prev.description || repoData.description || "",
                live_demo: prev.live_demo || repoData.homepage || "",
                technologies_used: Array.from(new Set([...prev.technologies_used, ...languages])),
                project_details: prev.project_details || readmeContent.slice(0, 2000) // Truncate README if huge
            }));

            toast.success("Imported technical data from GitHub! 🪄");
        } catch (err: any) {
            console.error("GitHub import error:", err);
            setError(`GitHub Import Failed: ${err.message}`);
        } finally {
            setFetchingGitHub(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const sizeError = validateImageSize(file);
        if (sizeError) {
            setError(sizeError);
            e.target.value = "";
            return;
        }

        // Show loading state
        setLoading(true);
        setError("");

        try {
            // Dynamic import to avoid SSR issues
            const { compressImageSimple, needsCompression } = await import("../utils/imageCompression");

            let fileToUpload = file;

            // Check if compression is needed (only if file > 200KB)
            if (needsCompression(file, 200)) {
                console.log(`Compressing image from ${(file.size / 1024 / 1024).toFixed(2)}MB...`);

                try {
                    // Use simple compression utility
                    fileToUpload = await compressImageSimple(file, {
                        maxSizeKB: 200,
                        maxWidth: 1280,
                        maxHeight: 1280,
                        quality: 0.8,
                    });
                } catch (compressionError) {
                    console.error("Compression failed, using original:", compressionError);
                }
            } else {
                console.log("Image is already under 200KB, no compression needed");
            }

            const formDataUpload = new FormData();
            formDataUpload.append("image", fileToUpload);

            const token = await getToken();
            const response = await api.post("/upload/image", formDataUpload, {
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });

            setFormData(prev => ({
                ...prev,
                cover_image: response.data.url
            }));
        } catch (error) {
            setError("Failed to upload image");
            console.error("Upload error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        // Manual validation
        if (!formData.title.trim()) {
            setError("Project Name is required");
            return;
        }
        if (!formData.description.trim()) {
            setError("Project Description is required");
            return;
        }
        if (formData.technologies_used.length === 0) {
            setError("At least one technology is required");
            return;
        }
        if (!formData.project_details.trim()) {
            setError("Project Details are required");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const token = await getToken();
            if (!token) {
                setError("Authentication required");
                return;
            }

            if (project) {
                await api.put(`/projects/${project.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Project updated successfully!");
            } else {
                const response = await api.post("/projects", formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.data.is_first) {
                    toast.success("You just shipped your first project! 🚀", {
                        position: "top-center",
                        autoClose: 6000,
                        icon: <span>🏆</span>,
                        style: {
                            borderRadius: '20px',
                            background: '#0f172a',
                            color: '#fff',
                            fontWeight: 900,
                            padding: '16px 24px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                            fontSize: '15px'
                        }
                    });
                } else {
                    toast.success("Project launched successfully! 🚀");
                }
            }

            window.dispatchEvent(new CustomEvent("projectCreated"));
            onUpdated();
            onClose();
        } catch (error: any) {
            const backendError = error.response?.data?.error || error.response?.data?.message || "Failed to save project";
            const backendDetails = error.response?.data?.details ? ` (${error.response.data.details})` : "";
            const backendCode = error.response?.data?.code ? ` [Code: ${error.response.data.code}]` : "";

            setError(`${backendError}${backendDetails}${backendCode}`);
            toast.error(backendError);
            console.error("Project save error:", error);
        } finally {
            setLoading(false);
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div
            className="modal-overlay"
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                padding: isMobile ? "0" : "24px 20px",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
            }}
            onClick={onClose}
        >
            <div
                className="modal-content"
                style={{
                    backgroundColor: "var(--bg-page)",
                    borderRadius: isMobile ? "0" : "24px",
                    width: "100%",
                    maxWidth: isMobile ? "100%" : "580px",
                    height: isMobile ? "100dvh" : "auto",
                    maxHeight: isMobile ? "100dvh" : "85vh",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    border: isMobile ? "none" : "1px solid var(--border-hairline)",
                    boxShadow: isMobile ? "none" : "0 24px 60px rgba(0,0,0,0.3)",
                    overflow: "hidden",
                    margin: "0",
                    animation: "modalEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <style>{`
                    @keyframes modalEnter {
                        from { opacity: 0; transform: scale(0.95) translateY(30px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    .project-form-input, .project-form-textarea, .project-form-select {
                        width: 100%;
                        padding: 14px 16px;
                        border: 1px solid var(--border-hairline);
                        border-radius: 12px;
                        font-size: 15px;
                        transition: all 0.2s ease;
                        background-color: var(--bg-hover);
                        box-sizing: border-box;
                        outline: none;
                        font-family: var(--font-main);
                        color: var(--text-primary);
                    }
                    .project-form-input:focus, .project-form-textarea:focus, .project-form-select:focus {
                        border-color: var(--text-primary);
                        background-color: var(--bg-page);
                        box-shadow: 0 0 0 4px rgba(var(--text-primary-rgb), 0.05);
                    }
                    .project-label {
                        display: block;
                        margin-bottom: 8px;
                        font-size: 13px;
                        font-weight: 700;
                        color: var(--text-tertiary);
                    }
                    .hide-scrollbar::-webkit-scrollbar { display: none; }
                    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>

                {/* Header */}
                <div style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid var(--border-hairline)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0
                }}>
                    <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                        {project ? "Update project" : "Launch new project"}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            fontSize: "28px",
                            fontWeight: 300,
                            lineHeight: 1,
                            padding: "0 0 3px 0",
                            color: "var(--text-tertiary)",
                            background: "none",
                            border: "none",
                            outline: "none"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    padding: "24px 32px",
                    overflowY: "auto",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px"
                }} className="hide-scrollbar">
                    {error && (
                        <div style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", color: "#ef4444", padding: "14px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="project-label">Project name *</label>
                        <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="project-form-input" placeholder="e.g. Lumina AI" />
                    </div>

                    <div>
                        <label className="project-label">Short description *</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows={2} className="project-form-textarea" placeholder="What are you building in one sentence?" />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr", gap: "20px" }}>
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <label className="project-label" style={{ marginBottom: 0 }}>GitHub repo</label>
                                <button type="button" onClick={handleGitHubImport} disabled={fetchingGitHub || !formData.github_repo} style={{ background: "none", border: "none", color: "var(--text-primary)", fontSize: "11px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", opacity: !formData.github_repo ? 0.4 : 1 }}>
                                    <GithubLogo size={14} />
                                    {fetchingGitHub ? "Importing..." : "Auto-fill from GitHub"}
                                </button>
                            </div>
                            <input type="url" name="github_repo" value={formData.github_repo} onChange={handleInputChange} className="project-form-input" placeholder="https://github.com/..." />
                        </div>
                        <div>
                            <label className="project-label">Status *</label>
                            <select name="status" value={formData.status} onChange={handleInputChange} className="project-form-select">
                                <option value="in_progress">🏗️ In progress</option>
                                <option value="completed">🚀 Completed</option>
                                <option value="paused">⏸️ Paused</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="project-label">Tech stack *</label>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                            <input type="text" value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTech())} placeholder="React, Node.js..." className="project-form-input" style={{ flex: 1 }} />
                            <button type="button" onClick={handleAddTech} style={{ padding: "0 18px", borderRadius: "12px", fontSize: "13px", fontWeight: 800, cursor: "pointer", background: "var(--text-primary)", color: "var(--bg-page)", border: "none" }}>Add</button>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {formData.technologies_used.map((tech, i) => (
                                <span key={i} style={{ padding: "6px 14px", borderRadius: "100px", background: "var(--bg-hover)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                                    {tech} <button onClick={() => handleRemoveTech(tech)} style={{ border: "none", background: "none", color: "var(--text-tertiary)", cursor: "pointer" }}><X size={12} /></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="project-label">Project details (Markdown supported) *</label>
                        <textarea name="project_details" value={formData.project_details} onChange={handleInputChange} rows={6} className="project-form-textarea" placeholder="Explain the technical details, challenges, and core features..." />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "rgba(var(--text-primary-rgb), 0.03)", borderRadius: "16px", border: "1px solid var(--border-hairline)" }}>
                        <div style={{ position: "relative", width: "20px", height: "20px" }}>
                            <input type="checkbox" checked={formData.looking_for_contributors || false} onChange={(e) => setFormData(p => ({ ...p, looking_for_contributors: e.target.checked }))} style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} />
                            <div style={{ width: "100%", height: "100%", border: "1px solid var(--border-hairline)", borderRadius: "6px", backgroundColor: formData.looking_for_contributors ? "var(--text-primary)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {formData.looking_for_contributors && <Check size={14} weight="bold" color="var(--bg-page)" />}
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>Open for co-founders</span>
                            <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Let others pitch themselves to join your mission.</span>
                        </div>
                    </div>

                    <div>
                        <label className="project-label">Cover image</label>
                        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                            {formData.cover_image ? (
                                <div style={{ width: "80px", height: "80px", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border-hairline)", flexShrink: 0 }}>
                                    <img src={formData.cover_image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                                </div>
                            ) : (
                                <div style={{ width: "80px", height: "80px", borderRadius: "12px", backgroundColor: "var(--bg-hover)", border: "1px dashed var(--border-hairline)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", flexShrink: 0 }}>
                                    <X size={24} weight="thin" />
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="project-form-input" style={{ fontSize: "12px" }} />
                                <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "6px" }}>Recommended: 1280x720px. Max 5MB.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: "16px 24px",
                    borderTop: "1px solid var(--border-hairline)",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    backgroundColor: "var(--bg-hover-light)"
                }}>
                    <button type="button" onClick={onClose} style={{ padding: "12px 24px", borderRadius: "100px", border: "1px solid var(--border-hairline)", background: "transparent", color: "var(--text-secondary)", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Cancel</button>
                    <button onClick={() => handleSubmit()} disabled={loading} style={{ padding: "12px 32px", borderRadius: "100px", border: "none", background: "var(--text-primary)", color: "var(--bg-page)", fontWeight: 800, fontSize: "14px", cursor: "pointer", transition: "all 0.2s", opacity: loading ? 0.5 : 1 }}>
                        {loading ? "Processing..." : (project ? "Save changes" : "Launch mission")}
                    </button>
                </div>
            </div>
        </div>
    );

    return mounted ? createPortal(modalContent, document.body) : null;
}
