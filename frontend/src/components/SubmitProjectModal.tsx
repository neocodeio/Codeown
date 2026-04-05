import { useState } from "react";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { toast } from "react-toastify";
import { X, Rocket, Link as LinkIcon, GithubLogo } from "phosphor-react";
import { motion, AnimatePresence } from "framer-motion";

interface SubmitProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  weekId: string;
}

export default function SubmitProjectModal({ isOpen, onClose, onSubmitted, weekId }: SubmitProjectModalProps) {
  const { getToken } = useClerkAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return toast.error("Title and description are required");

    setIsSubmitting(true);
    try {
      const token = await getToken();
      await api.post(`/ship/submit/${weekId}`, { 
        title, 
        description, 
        demo_url: demoUrl, 
        github_url: githubUrl 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Project submitted! Good luck. 🚀");
      onSubmitted();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to submit project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000,
        padding: "20px"
      }} onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "var(--bg-page)",
            border: "1px solid var(--border-hairline)",
            borderRadius: "24px",
            width: "100%", maxWidth: "500px", padding: "32px",
            position: "relative"
          }}
        >
          <button onClick={onClose} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}><X size={20} /></button>

          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Rocket size={32} />
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "8px" }}>Submit Your Ship</h2>
            <p style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>Tell the community what you've built this week.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
                Project Title
              </label>
              <input 
                type="text" 
                placeholder="e.g., Codeown Real-time Feed" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-hairline)", background: "var(--bg-hover)", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
                Description
              </label>
              <textarea 
                placeholder="What does it do? Why is it cool?" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-hairline)", background: "var(--bg-hover)", outline: "none", resize: "none" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
               <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                   <LinkIcon size={14} /> Demo URL
                </label>
                <input 
                  type="url" 
                  placeholder="https://..." 
                  value={demoUrl} 
                  onChange={(e) => setDemoUrl(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-hairline)", background: "var(--bg-hover)", outline: "none", fontSize: "13px" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                   <GithubLogo size={14} /> GitHub (Optional)
                </label>
                <input 
                  type="url" 
                  placeholder="github.com/..." 
                  value={githubUrl} 
                  onChange={(e) => setGithubUrl(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-hairline)", background: "var(--bg-hover)", outline: "none", fontSize: "13px" }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="glow-button"
              style={{ width: "100%", justifyContent: "center", padding: "14px", marginTop: "12px" }}
            >
              {isSubmitting ? "Submitting..." : "Submit Ship"}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
