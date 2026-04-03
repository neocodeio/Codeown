import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toPng } from "html-to-image";
import { X, Download, TwitterLogo, Check } from "phosphor-react";
import logo from "../assets/logo-white.png";

interface StatItem {
  label: string;
  value: number;
}

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    username: string;
    avatar_url?: string | null;
  };
  stats: StatItem[];
  title?: string;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  stats, 
  title = "Performance Profile" 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [imageGenerated, setImageGenerated] = useState(false);

  useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const downloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: "#111111",
      });
      const link = document.createElement("a");
      link.download = `${user.username}-codeown-stats.png`;
      link.href = dataUrl;
      link.click();
      setImageGenerated(true);
      setTimeout(() => setImageGenerated(false), 2000);
    } catch (err) {
      console.error("Failed to download image:", err);
    } finally {
      setExporting(false);
    }
  };

  const shareToX = () => {
    const text = `Check out my progress on @Codeown! 🛠️\n\n${stats.map(s => `${s.label}: ${s.value.toLocaleString()}`).join('\n')}\n\nJoin me here: codeown.io/${user.username} #Codeown2026 #BuildInPublic`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  if (!isOpen) return null;

  const modalContent = (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(4px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }} onClick={onClose}>
      <div 
        style={{
          width: "100%",
          maxWidth: "650px",
          backgroundColor: "var(--bg-page)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          animation: "modalEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }} 
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes modalEnter {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
        
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "0.5px solid var(--border-hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Share your stats</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: "4px" }}>
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content / Preview */}
        <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "32px", alignItems: "center" }}>
          
          {/* THE CARD PREVIEW (This is what gets captured) */}
          <div 
            ref={cardRef} 
            style={{ 
              width: "100%", 
              maxWidth: "540px", 
              aspectRatio: "1.5 / 1",
              padding: "40px", 
              backgroundColor: "#111111", 
              color: "#FFFFFF", 
              fontFamily: "Inter, system-ui, sans-serif",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderRadius: "16px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              border: "0.5px solid rgba(255, 255, 255, 0.1)",
              position: "relative"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <img 
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=212121&color=ffffff&bold=true`} 
                      alt={user.name} 
                      style={{ width: "56px", height: "56px", borderRadius: "10px", border: "0.5px solid rgba(255,255,255,0.1)" }}
                  />
                  <div>
                      <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>{user.name}</h2>
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>@codeown/{user.username}</p>
                  </div>
              </div>
              <img src={logo} alt="Codeown" style={{ height: "24px", width: "auto" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: "24px", margin: "32px 0" }}>
               {stats.map((s, i) => (
                  <div key={i}>
                      <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{s.label}</p>
                      <h3 style={{ fontSize: "28px", fontWeight: 800, margin: 0 }}>{(s.value || 0).toLocaleString()}</h3>
                  </div>
               ))}
            </div>

            <div style={{ borderTop: "0.5px solid rgba(255, 255, 255, 0.1)", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                  {title} on <span style={{ color: "#FFFFFF", fontWeight: 600 }}>Codeown</span>
              </p>
              <div style={{ padding: "5px 10px", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "6px", fontSize: "10px", fontWeight: 700 }}>
                  #Codeown2026
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", width: "100%", maxWidth: "540px" }}>
            <button 
                onClick={downloadImage}
                disabled={exporting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "16px",
                  backgroundColor: "var(--bg-hover)",
                  color: "var(--text-primary)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--border-hairline)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
            >
              {imageGenerated ? <Check size={20} weight="bold" color="#10b981" /> : <Download size={20} weight="bold" />}
              {exporting ? "Generating..." : (imageGenerated ? "Saved!" : "Download Image")}
            </button>

            <button 
                onClick={shareToX}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "16px",
                  backgroundColor: "var(--text-primary)",
                  color: "var(--bg-page)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "opacity 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <TwitterLogo size={20} weight="fill" />
              Post on X
            </button>
          </div>

          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>
            Share your progress to get more visibility for your projects.
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
