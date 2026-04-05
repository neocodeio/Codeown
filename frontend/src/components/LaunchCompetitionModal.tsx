import { useState } from "react";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { toast } from "react-toastify";
import { X, Rocket, Calendar, TextT, IdentificationBadge } from "phosphor-react";
import { motion, AnimatePresence } from "framer-motion";

interface LaunchCompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunched: () => void;
}

export default function LaunchCompetitionModal({ isOpen, onClose, onLaunched }: LaunchCompetitionModalProps) {
  const { getToken } = useClerkAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !deadline) return toast.error("Please fill all fields");

    setIsLaunching(true);
    try {
      const token = await getToken();
      await api.post("/ship/launch", { name, description, deadline }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Competition launched successfully! 🚀");
      onLaunched();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to launch competition");
    } finally {
      setIsLaunching(false);
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
              <Rocket size={32} weight="fill" />
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "8px" }}>Launch New Week</h2>
            <p style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>Set the stage for the next high-stakes competition.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <IdentificationBadge size={16} /> Competition Name
              </label>
              <input 
                type="text" 
                placeholder="e.g., The Performance Week" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--border-hairline)", background: "var(--bg-hover)", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <TextT size={16} /> Description
              </label>
              <textarea 
                placeholder="Brief guidelines and inspiration..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--border-hairline)", background: "var(--bg-hover)", outline: "none", resize: "none" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={16} /> Submission Deadline (Sunday)
              </label>
              <input 
                type="datetime-local" 
                value={deadline} 
                onChange={(e) => setDeadline(e.target.value)}
                style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--border-hairline)", background: "var(--bg-hover)", outline: "none" }}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLaunching}
              className="glow-button"
              style={{ width: "100%", justifyContent: "center", padding: "16px", marginTop: "12px" }}
            >
              {isLaunching ? "Launching..." : "LAUNCH COMPETITION"}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
