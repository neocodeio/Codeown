import { useState, useEffect } from "react";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import type { Project, ProjectFormData } from "../types/project";
import { X, Check } from "phosphor-react";
import VerifiedBadge from "./VerifiedBadge";
import { validateImageSize } from "../constants/upload";
import confetti from "canvas-confetti";
import { toast } from "react-toastify";

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
    project?: Project | null;
}

export default function ProjectModal({ isOpen, onClose, onUpdated, project }: ProjectModalProps) {
    const { getToken } = useClerkAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [techInput, setTechInput] = useState("");

    const [formData, setFormData] = useState<ProjectFormData>({
        title: "",
        description: "",
        technologies_used: [],
        status: "in_progress",
        github_repo: "",
        live_demo: "",
        cover_image: "",
        project_details: "",
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                padding: "0",
                backdropFilter: "blur(4px)",
            }}
            onClick={onClose}
        >
            <style>{`
        @keyframes modalEnter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .modal-content {
          animation: modalEnter 0.2s ease-out;
        }
        .form-input, .form-textarea, .form-select {
          width: 100%;
          padding: 14px 18px;
          border: 0.5px solid var(--border-hairline);
          borderRadius: 2px;
          fontSize: 14px;
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
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .responsive-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        @media (max-width: 640px) {
          .responsive-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
            <div
                className="modal-content"
                style={{
                    backgroundColor: "var(--bg-page)",
                    borderRadius: "0",
                    width: "100%",
                    maxWidth: "600px",
                    maxHeight: "90vh",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    border: "0.5px solid var(--border-hairline)",
                    boxShadow: "none",
                    overflow: "hidden",
                    margin: "16px"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Fixed Header */}
                <div style={{ padding: "32px 40px 24px", borderBottom: "0.5px solid var(--border-hairline)", position: "relative" }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: "absolute",
                            top: "32px",
                            right: "32px",
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
                        <X size={20} weight="thin" />
                    </button>
                    <h2 className="modal-header-title" style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {project ? "EDIT PROJECT" : "NEW PROJECT"}
                    </h2>
                </div>

                {/* Scrolling Content */}
                <div style={{ padding: "40px", overflowY: "auto", flex: 1 }}>
                    {error && (
                        <div style={{
                            backgroundColor: "transparent",
                            color: "#ef4444",
                            padding: "16px 20px",
                            borderRadius: "2px",
                            marginBottom: "32px",
                            fontSize: "11px",
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            border: "0.5px solid #ef4444",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                        }}>
                            {error}
                        </div>
                    )}

                    <form id="project-form" onSubmit={handleSubmit}>
                        <div style={{ marginBottom: "32px" }}>
                            <label className="form-item-label">
                                Project Name *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                className="form-input"
                                placeholder="Give it a name..."
                            />
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <label className="form-item-label">
                                Project Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                                rows={3}
                                className="form-textarea"
                                placeholder="What is this about?"
                            />
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <label className="form-item-label">
                                Technologies Used *
                            </label>
                            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                                <input
                                    type="text"
                                    value={techInput}
                                    onChange={(e) => setTechInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTech())}
                                    placeholder="e.g. React, Node.js"
                                    className="form-input"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTech}
                                    style={{
                                        padding: "0 24px",
                                        backgroundColor: "var(--text-primary)",
                                        color: "var(--bg-page)",
                                        border: "none",
                                        borderRadius: "2px",
                                        cursor: "pointer",
                                        fontWeight: 800,
                                        fontSize: "11px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        textTransform: "uppercase",
                                        fontFamily: "var(--font-mono)",
                                        letterSpacing: "0.1em"
                                    }}
                                >
                                    <span>ADD</span>
                                </button>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                {formData.technologies_used.map((tech, index) => (
                                    <span
                                        key={index}
                                        style={{
                                            border: "0.5px solid var(--border-hairline)",
                                            padding: "6px 12px",
                                            borderRadius: "2px",
                                            fontSize: "11px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            fontFamily: "var(--font-mono)",
                                            textTransform: "uppercase",
                                            color: "var(--text-tertiary)"
                                        }}
                                    >
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
                                                display: "flex", alignItems: "center"
                                            }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>


                        <div style={{ marginBottom: "32px" }}>
                            <label className="form-item-label">
                                Contributors (Usernames)
                            </label>
                            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                                <input
                                    type="text"
                                    value={contributorInput}
                                    onChange={(e) => setContributorInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddContributor())}
                                    placeholder="Enter username"
                                    className="form-input"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddContributor}
                                    style={{
                                        padding: "0 24px",
                                        backgroundColor: "var(--text-primary)",
                                        color: "var(--bg-page)",
                                        border: "none",
                                        borderRadius: "2px",
                                        cursor: "pointer",
                                        fontWeight: 800,
                                        fontSize: "11px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        textTransform: "uppercase",
                                        fontFamily: "var(--font-mono)",
                                        letterSpacing: "0.1em"
                                    }}
                                >
                                    <span>ADD</span>
                                </button>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                {(formData.contributors || []).map((contributor, index) => (
                                    <span
                                        key={index}
                                        style={{
                                            border: "0.5px solid var(--border-hairline)",
                                            padding: "6px 12px",
                                            borderRadius: "2px",
                                            fontSize: "11px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            fontFamily: "var(--font-mono)",
                                            textTransform: "uppercase",
                                            color: "var(--text-tertiary)"
                                        }}
                                    >
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
                                                display: "flex", alignItems: "center"
                                            }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <label className="form-item-label">
                                Project Status *
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                required
                                className="form-select"
                            >
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="paused">Paused</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: "32px" }}>
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
                                        borderRadius: "2px",
                                        backgroundColor: formData.looking_for_contributors ? "var(--text-primary)" : "transparent",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}>
                                        {formData.looking_for_contributors && <Check size={12} weight="bold" color="var(--bg-page)" />}
                                    </div>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>Looking for Co-Founder</span>
                            </label>
                            <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "8px", marginLeft: "30px", lineHeight: 1.5, letterSpacing: "-0.01em" }}>
                                Enable this to let other developers know you're open for a Co-Founder to join your mission.
                            </p>
                        </div>

                        <div className="responsive-grid">
                            <div>
                                <label className="form-item-label">
                                    GitHub Repository
                                </label>
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
                                    Live Demo
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

                        <div style={{ marginBottom: "32px" }}>
                            <label className="form-item-label">
                                Cover Image
                            </label>
                            {formData.cover_image && (
                                <div style={{ marginBottom: "16px", borderRadius: "2px", overflow: "hidden", border: "0.5px solid var(--border-hairline)" }}>
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
                                    style={{ padding: "12px" }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: "40px" }}>
                            <label className="form-item-label">
                                Project Details *
                            </label>
                            <textarea
                                name="project_details"
                                value={formData.project_details}
                                onChange={handleInputChange}
                                required
                                rows={8}
                                className="form-textarea"
                                placeholder="Deep dive into the technical details..."
                            />
                        </div>
                    </form>
                </div>

                {/* Fixed Footer */}
                <div style={{ padding: "32px 40px", backgroundColor: "var(--bg-page)", borderTop: "0.5px solid var(--border-hairline)", display: "flex", gap: "16px", justifyContent: "flex-end" }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: "0 24px",
                            height: "44px",
                            backgroundColor: "transparent",
                            color: "var(--text-tertiary)",
                            border: "0.5px solid var(--border-hairline)",
                            borderRadius: "2px",
                            cursor: "pointer",
                            fontWeight: 800,
                            fontSize: "11px",
                            fontFamily: "var(--font-mono)",
                            transition: "all 0.15s ease",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em"
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                            e.currentTarget.style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "var(--text-tertiary)";
                        }}
                    >
                        CANCEL
                    </button>
                    <button
                        type="submit"
                        form="project-form"
                        disabled={loading}
                        style={{
                            padding: "0 32px",
                            height: "44px",
                            backgroundColor: loading ? "var(--bg-hover)" : "var(--text-primary)",
                            color: loading ? "var(--text-tertiary)" : "var(--bg-page)",
                            border: "none",
                            borderRadius: "2px",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontWeight: 800,
                            fontSize: "11px",
                            fontFamily: "var(--font-mono)",
                            transition: "all 0.15s ease",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em"
                        }}
                    >
                        {loading ? "SHIPPING..." : (project ? "UPDATE" : "LAUNCH")}
                    </button>
                </div>
            </div>
        </div>
    );
}
