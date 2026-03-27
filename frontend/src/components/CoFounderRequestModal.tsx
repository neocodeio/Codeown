import React, { useState } from "react";
import { X, Handshake, Info } from "phosphor-react";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";

interface CoFounderRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projectId: number;
  projectTitle: string;
}

export default function CoFounderRequestModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  projectTitle
}: CoFounderRequestModalProps) {
  const { getToken } = useClerkAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    skills: "",
    hoursPerWeek: "10",
    reason: "",
    contribution: ""
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.skills || !formData.reason || !formData.contribution) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const skillsArray = formData.skills.split(",").map(s => s.trim()).filter(Boolean);

      const response = await api.post(`/projects/${projectId}/cofounder-request`, {
        ...formData,
        skills: skillsArray
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error("Error submitting co-founder request:", error);
      const errorMsg = error.response?.data?.details || error.response?.data?.error || "Failed to submit request";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.85)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    }} onClick={onClose}>
      <div 
        style={{
          width: "100%",
          maxWidth: "540px",
          backgroundColor: "var(--bg-page)",
          border: "1px solid var(--border-hairline)",
          borderRadius: "var(--radius-lg)",
          position: "relative",
          animation: "modalEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "24px",
          borderBottom: "0.5px solid var(--border-hairline)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#000"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-xs)",
              backgroundColor: "rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "0.5px solid rgba(255,255,255,0.1)"
            }}>
              <Handshake size={18} weight="duotone" color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0 }}>
                Co-founder application
              </h2>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", margin: "4px 0 0 0", fontWeight: 500 }}>
                Target project: {projectTitle}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: "none", 
              border: "none", 
              color: "rgba(255,255,255,0.4)", 
              cursor: "pointer",
              padding: "4px",
              transition: "color 0.15s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: "32px", overflowY: "auto", flex: 1 }}>
          <div style={{ 
            backgroundColor: "rgba(0,0,0,0.4)", 
            border: "0.5px solid var(--border-hairline)", 
            borderRadius: "var(--radius-sm)",
            padding: "16px", 
            marginBottom: "32px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start"
          }}>
            <Info size={20} weight="duotone" color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: "12px", color: "var(--text-tertiary)", lineHeight: 1.6 }}>
                <strong>Eligibility check:</strong> To prevent spam, you must have at least 1 post, 1 project, and tech skills on your profile to apply.
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Skills */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                Core skills for this mission
              </label>
              <input 
                type="text"
                placeholder="React, TypeScript, UI/UX Design..."
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--text-primary)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border-hairline)"}
              />
            </div>

            {/* Commitment */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                Weekly commitment (hours)
              </label>
              <input 
                type="number"
                min="1"
                max="168"
                value={formData.hoursPerWeek}
                onChange={(e) => setFormData({ ...formData, hoursPerWeek: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  fontFamily: "var(--font-mono)",
                  outline: "none"
                }}
              />
            </div>

            {/* Why Join */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                Why do you want to join this project?
              </label>
              <textarea 
                placeholder="What about this mission resonates with you?"
                rows={4}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  outline: "none",
                  resize: "none"
                }}
              />
            </div>

            {/* Contribution */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                What can you bring to the table?
              </label>
              <textarea 
                placeholder="Describe your unique value proposition..."
                rows={4}
                value={formData.contribution}
                onChange={(e) => setFormData({ ...formData, contribution: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  outline: "none",
                  resize: "none"
                }}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: "var(--text-primary)",
                color: "var(--bg-page)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = "brightness(0.9)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: "16px", height: "16px", border: "2px solid rgba(0,0,0,0.1)", borderTopColor: "#000", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  Transmitting...
                </>
              ) : (
                <>
                  Submit application
                </>
              )}
            </button>
          </form>
        </div>

        <style>{`
          @keyframes modalEnter {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
