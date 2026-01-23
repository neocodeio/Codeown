import { useState, useEffect } from "react";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import type { Project, ProjectFormData } from "../types/project";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

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
      });
    }
    setTechInput("");
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const token = await getToken();
      const response = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
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
      } else {
        await api.post("/projects", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      onUpdated();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to save project");
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
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div 
        className="modal-content"
        style={{
          backgroundColor: "#fff",
          borderRadius: "20px",
          padding: "30px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#666",
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <h2 style={{ marginBottom: "30px", fontSize: "28px", fontWeight: 800 }}>
          {project ? "Edit Project" : "Add New Project"}
        </h2>

        {error && (
          <div style={{
            backgroundColor: "#fee",
            color: "#c00",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #fcc",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
              Project Name *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
              Project Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
              Technologies Used *
            </label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTech())}
                placeholder="Add technology and press Enter"
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "16px",
                }}
              />
              <button
                type="button"
                onClick={handleAddTech}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#000",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Add
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {formData.technologies_used.map((tech, index) => (
                <span
                  key={index}
                  style={{
                    backgroundColor: "#f0f0f0",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
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
                      color: "#666",
                      fontSize: "16px",
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
              Project Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
              }}
            >
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
              GitHub Repository
            </label>
            <input
              type="url"
              name="github_repo"
              value={formData.github_repo}
              onChange={handleInputChange}
              placeholder="https://github.com/username/repo"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
              Live Demo
            </label>
            <input
              type="url"
              name="live_demo"
              value={formData.live_demo}
              onChange={handleInputChange}
              placeholder="https://example.com"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
              Cover Image
            </label>
            {formData.cover_image && (
              <div style={{ marginBottom: "10px" }}>
                <img
                  src={formData.cover_image}
                  alt="Cover"
                  style={{
                    width: "100%",
                    maxHeight: "200px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            />
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
              Project Details *
            </label>
            <textarea
              name="project_details"
              value={formData.project_details}
              onChange={handleInputChange}
              required
              rows={6}
              placeholder="Describe your project in detail..."
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "12px 24px",
                backgroundColor: "#f5f5f5",
                color: "#333",
                border: "1px solid #ddd",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 24px",
                backgroundColor: loading ? "#ccc" : "#000",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              {loading ? "Saving..." : (project ? "Update Project" : "Create Project")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
