import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import api from "../api/axios";
import type { Project, ProjectFormData } from "../types/project";
import { X, Check, GithubLogo } from "phosphor-react";
import VerifiedBadge from "./VerifiedBadge";
import { validateImageSize } from "../constants/upload";
import confetti from "canvas-confetti";
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
    const [contributorInput, setContributorInput] = useState("");

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
        setContributorInput("");
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

    const handleAddContributor = () => {
        if (contributorInput.trim() && !formData.contributors?.includes(contributorInput.trim())) {
            setFormData(prev => ({
                ...prev,
                contributors: [...(prev.contributors || []), contributorInput.trim()]
            }));
            setContributorInput("");
        }
    };

    const handleRemoveContributor = (contributorToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            contributors: prev.contributors?.filter(c => c !== contributorToRemove)
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

                // Play the sound effect
                try {
                    const audio = new Audio('/achievementunlocked.mp3');
                    audio.volume = 0.5; // 50% volume so it isn't deafening
                    audio.play().catch(e => console.log("Audio playback was prevented by the browser:", e));
                } catch (e) {
                    console.error("Failed to play sound:", e);
                }

                if (response.data.is_first) {
                    // Confetti trigger for first project!
                    const duration = 5 * 1000;
                    const animationEnd = Date.now() + duration;
                    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 11000 };

                    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

                    const interval: any = setInterval(function () {
                        const timeLeft = animationEnd - Date.now();

                        if (timeLeft <= 0) {
                            return clearInterval(interval);
                        }

                        const particleCount = 50 * (timeLeft / duration);
                        // since particles fall down, start a bit higher than random
                        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
                    }, 250);

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
                zIndex: 3000,
                padding: isMobile ? "0" : "24px 20px",
                backdropFilter: "blur(8px)",
            }}
            onClick={onClose}
        >
            <div
                className="modal-content"
                style={{
                    backgroundColor: "var(--bg-page)",
                    borderRadius: isMobile ? "0" : "var(--radius-lg)",
                    width: "100%",
                    maxWidth: isMobile ? "100%" : "680px",
                    height: isMobile ? "100dvh" : "auto",
                    maxHeight: isMobile ? "100dvh" : "90vh",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    border: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                    boxShadow: isMobile ? "none" : "0 24px 48px rgba(0,0,0,0.2)",
                    overflow: "hidden",
                    margin: "0",
                    animation: "modalEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <style>{`
                    @keyframes modalEnter {
                        from { opacity: 0; transform: scale(0.98) translateY(10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    .form-input, .form-textarea, .form-select {
                        width: 100%;
                        padding: 12px 14px;
                        border: 0.5px solid var(--border-hairline);
                        border-radius: var(--radius-sm);
                        font-size: 14px;
                        transition: all 0.15s ease;
                        background-color: var(--bg-hover);
                        box-sizing: border-box;
                        outline: none;
                        font-family: var(--font-main);
                        color: var(--text-primary);
                    }
                    .form-input:focus, .form-textarea:focus, .form-select:focus {
                        border-color: var(--text-primary);
                        background-color: var(--bg-page);
                    }
                    .form-item-label {
                        display: block;
                        margin-bottom: 10px;
                        font-family: var(--font-main);
                        font-size: 13px;
                        font-weight: 600;
                        color: var(--text-tertiary);
                    }
                    .responsive-grid {
                        display: grid;
                        grid-template-columns: ${isMobile ? "1fr" : "1fr 1fr"};
                        gap: 24px;
                        margin-bottom: 32px;
                    }
                `}</style>
                {/* Fixed Header */}
                <div style={{ 
                    padding: isMobile ? "20px" : "24px 32px", 
                    borderBottom: "0.5px solid var(--border-hairline)", 
                    position: "relative",
                    flexShrink: 0 // Prevent header from shrinking
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: "absolute",
                            top: isMobile ? "18px" : "22px",
                            right: isMobile ? "20px" : "32px",
                            background: "transparent",
                            border: "none",
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "var(--text-tertiary)",
                            transition: "all 0.15s ease",
                            zIndex: 10,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
                    >
                        <X size={20} weight="regular" />
                    </button>
                    <h2 className="modal-header-title" style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                        {project ? "Edit project" : "New project"}
                    </h2>
                </div>

                {/* Scrolling Content */}
                <div style={{ 
                    padding: isMobile ? "24px 20px" : "32px", 
                    overflowY: "auto", 
                    flex: 1, 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "28px",
                    minHeight: 0 // Crucial for flexbox scroll behavior
                }}>
                    {error && (
                        <div style={{
                            backgroundColor: "rgba(239, 68, 68, 0.05)",
                            color: "#ef4444",
                            padding: "12px 16px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "13px",
                            fontWeight: 600,
                            border: "0.5px solid #ef4444",
                        }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="form-item-label">
                            Project name *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="My awesome project"
                        />
                    </div>

                    <div>
                        <label className="form-item-label">
                            Project description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="form-textarea"
                            placeholder="A brief overview of your project"
                        />
                    </div>

                    <div>
                        <label className="form-item-label">
                            Founder's Vision (What's next?) (Optional)
                        </label>
                        <input
                            type="text"
                            name="founder_vision"
                            value={formData.founder_vision}
                            onChange={handleInputChange}
                            maxLength={140}
                            className="form-input"
                            placeholder="Working on Auth... or Finalizing UI... (max 140 chars)"
                        />
                    </div>

                    <div>
                        <label className="form-item-label">
                            Technologies used *
                        </label>
                        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                            <input
                                type="text"
                                value={techInput}
                                onChange={(e) => setTechInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTech())}
                                placeholder="e.g. React, Node.js"
                                className="form-input"
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                onClick={handleAddTech}
                                style={{
                                    padding: "0 20px",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    background: "transparent",
                                    color: "var(--text-primary)",
                                    border: "0.5px solid var(--border-hairline)",
                                    display: "flex",
                                    alignItems: "center",
                                    transition: "all 0.15s ease"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                Add
                            </button>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {formData.technologies_used.map((tech, index) => (
                                <div key={index} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--bg-hover)", color: "var(--text-primary)", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, border: "0.5px solid var(--border-hairline)" }}>
                                    {tech}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTech(tech)}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            color: "var(--text-tertiary)",
                                            fontSize: "14px",
                                            display: "flex",
                                            alignItems: "center",
                                            padding: 0
                                        }}
                                    >
                                        <X size={12} weight="regular" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>


                    <div>
                        <label className="form-item-label">
                            Contributors (usernames)
                        </label>
                        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                            <input
                                type="text"
                                value={contributorInput}
                                onChange={(e) => setContributorInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddContributor())}
                                placeholder="Enter username"
                                className="form-input"
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                onClick={handleAddContributor}
                                style={{
                                    padding: "0 20px",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    background: "transparent",
                                    color: "var(--text-primary)",
                                    border: "0.5px solid var(--border-hairline)",
                                    display: "flex",
                                    alignItems: "center",
                                    transition: "all 0.15s ease"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                Add
                            </button>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {(formData.contributors || []).map((contributor, index) => (
                                <div key={index} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--bg-hover)", color: "var(--text-primary)", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, border: "0.5px solid var(--border-hairline)" }}>
                                    @{contributor}
                                    <VerifiedBadge username={contributor} size="12px" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveContributor(contributor)}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            color: "var(--text-tertiary)",
                                            fontSize: "14px",
                                            display: "flex",
                                            alignItems: "center",
                                            padding: 0,
                                            marginLeft: "4px"
                                        }}
                                    >
                                        <X size={12} weight="regular" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="form-item-label">
                            Project status *
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="form-select"
                        >
                            <option value="in_progress">In progress</option>
                            <option value="completed">Completed</option>
                            <option value="paused">Paused</option>
                        </select>
                    </div>

                        <div style={{ marginBottom: "12px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                                <div style={{ position: "relative", width: "18px", height: "18px" }}>
                                    <input
                                        type="checkbox"
                                        name="looking_for_contributors"
                                        checked={formData.looking_for_contributors || false}
                                        onChange={(e) => setFormData(prev => ({ ...prev, looking_for_contributors: e.target.checked }))}
                                        style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
                                    />
                                    <div style={{
                                        width: "100%", height: "100%",
                                        border: "0.5px solid var(--border-hairline)",
                                        borderRadius: "var(--radius-xs)",
                                        backgroundColor: formData.looking_for_contributors ? "var(--text-primary)" : "transparent",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}>
                                        {formData.looking_for_contributors && <Check size={12} weight="bold" color="var(--bg-page)" />}
                                    </div>
                                </div>
                                <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>Looking for co-founder</span>
                            </label>
                            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", marginTop: "8px", marginLeft: "30px", lineHeight: 1.5 }}>
                                Enable this to let other developers know you're open for a co-founder to join your mission.
                            </p>
                        </div>

                        <div className="responsive-grid">
                            <div>
                                <div style={{ 
                                    display: "flex", 
                                    alignItems: isMobile ? "flex-start" : "center", 
                                    flexDirection: isMobile ? "column" : "row",
                                    justifyContent: "space-between", 
                                    gap: isMobile ? "8px" : "10px",
                                    marginBottom: "10px" 
                                }}>
                                    <label className="form-item-label" style={{ marginBottom: 0 }}>
                                        GitHub repository
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleGitHubImport}
                                        disabled={fetchingGitHub || !formData.github_repo}
                                        style={{
                                            backgroundColor: "transparent",
                                            border: "0.5px solid var(--border-hairline)",
                                            color: fetchingGitHub || !formData.github_repo ? "var(--text-tertiary)" : "var(--text-primary)",
                                            padding: "6px 12px",
                                            borderRadius: "var(--radius-sm)",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            cursor: fetchingGitHub || !formData.github_repo ? "not-allowed" : "pointer",
                                            transition: "all 0.15s ease"
                                        }}
                                        onMouseEnter={e => {
                                            if (!fetchingGitHub && formData.github_repo) {
                                                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                                e.currentTarget.style.borderColor = "var(--text-primary)";
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.backgroundColor = "transparent";
                                            e.currentTarget.style.borderColor = "var(--border-hairline)";
                                        }}
                                    >
                                        <GithubLogo size={14} weight="regular" />
                                        {fetchingGitHub ? "Importing..." : "Import data"}
                                    </button>
                                </div>
                                <input
                                    type="url"
                                    name="github_repo"
                                    value={formData.github_repo}
                                    onChange={handleInputChange}
                                    placeholder="https://github.com/..."
                                    className="form-input"
                                />
                            </div>

                            <div>
                                <label className="form-item-label">
                                    Live demo
                                </label>
                                <input
                                    type="url"
                                    name="live_demo"
                                    value={formData.live_demo}
                                    onChange={handleInputChange}
                                    placeholder="https://..."
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                            <label className="form-item-label">
                                Cover image
                            </label>
                            {formData.cover_image && (
                                <div style={{ marginBottom: "16px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "0.5px solid var(--border-hairline)" }}>
                                    <img
                                        src={formData.cover_image}
                                        alt="Cover"
                                        style={{
                                            width: "100%",
                                            maxHeight: "200px",
                                            objectFit: "cover",
                                        }}
                                    />
                                </div>
                            )}
                            <div style={{ position: "relative" }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="form-input"
                                    style={{ padding: "10px" }}
                                />
                            </div>
                        </div>

                    <div>
                        <label className="form-item-label">
                            Project details *
                        </label>
                        <textarea
                            name="project_details"
                            value={formData.project_details}
                            onChange={handleInputChange}
                            rows={8}
                            className="form-textarea"
                            placeholder="A deep dive into the technical details of your project..."
                        />
                    </div>
                </div>

                {/* Fixed Footer */}
                <div style={{ 
                    padding: isMobile ? "16px 20px calc(16px + env(safe-area-inset-bottom))" : "20px 32px", 
                    backgroundColor: "transparent", 
                    borderTop: "0.5px solid var(--border-hairline)",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    flexShrink: 0
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: "12px 24px",
                            backgroundColor: "transparent",
                            color: "var(--text-secondary)",
                            border: "0.5px solid var(--border-hairline)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                            e.currentTarget.style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        onClick={() => handleSubmit()}
                        style={{
                            padding: "12px 32px",
                            backgroundColor: "var(--text-primary)",
                            color: "var(--bg-page)",
                            border: "none",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.7 : 1,
                            transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) e.currentTarget.style.opacity = "0.9";
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) e.currentTarget.style.opacity = "1";
                        }}
                    >
                        {loading ? "Processing..." : project ? "Update project" : "Launch project"}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
