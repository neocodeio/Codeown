import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { ShareNetwork } from "phosphor-react";
import logo from "../assets/icon-removebg.png"; // Use platform logo

interface StatItem {
  label: string;
  value: number;
}

interface ShareableAnalyticsCardProps {
  user: {
    name: string;
    username: string;
    avatar_url?: string | null;
  };
  stats: StatItem[];
  title?: string;
}

export const ShareableAnalyticsCard: React.FC<ShareableAnalyticsCardProps> = ({ user, stats, title = "Performance Profile" }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const exportImage = async () => {
    if (!cardRef.current) return;
    try {
      setExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: "#111111", // Dark theme background
        style: {
            borderRadius: "0", // Remove border radius for full capture
        }
      });
      const link = document.createElement("a");
      link.download = `${user.username}-codeown-analytics.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate analytics card:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div style={{ position: "absolute", left: "-9999px" }}>
        <div 
          ref={cardRef} 
          style={{ 
            width: "600px", 
            minHeight: "400px", 
            padding: "40px", 
            backgroundColor: "#111111", 
            color: "#FFFFFF", 
            fontFamily: "Inter, system-ui, sans-serif",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "0.5px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <img 
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=212121&color=ffffff&bold=true`} 
                    alt={user.name} 
                    style={{ width: "64px", height: "64px", borderRadius: "12px", border: "0.5px solid rgba(255,255,255,0.1)" }}
                />
                <div>
                    <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>{user.name}</h2>
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: "4px 0 0" }}>@codeown/{user.username}</p>
                </div>
            </div>
            <img src={logo} alt="Codeown" style={{ width: "32px", height: "32px" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: "32px", margin: "40px 0" }}>
             {stats.map((s, i) => (
                <div key={i}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>{s.label}</p>
                    <h3 style={{ fontSize: "32px", fontWeight: 800, margin: 0 }}>{(s.value || 0).toLocaleString()}</h3>
                </div>
             ))}
          </div>

          <div style={{ borderTop: "0.5px solid rgba(255, 255, 255, 0.1)", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                {title} on <span style={{ color: "#FFFFFF", fontWeight: 700 }}>Codeown</span>
            </p>
            <div style={{ padding: "6px 12px", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
                #Codeown2026
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={exportImage}
        disabled={exporting}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "var(--text-primary)",
          color: "var(--bg-page)",
          border: "none",
          borderRadius: "var(--radius-sm)",
          padding: "10px 20px",
          fontWeight: 700,
          fontSize: "13px",
          cursor: "pointer",
          transition: "all 0.15s ease",
          opacity: exporting ? 0.7 : 1
        }}
      >
        <ShareNetwork size={18} weight="bold" />
        {exporting ? "Generating Card..." : "Share Stats Card"}
      </button>
    </>
  );
};
