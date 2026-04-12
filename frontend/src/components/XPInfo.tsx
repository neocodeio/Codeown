import { useState } from "react";
import { Info, Plus, Flame, Heart, ChatCircle, ShareNetwork, Rocket } from "phosphor-react";

export default function XPInfo() {
  const [showTooltip, setShowTooltip] = useState(false);

  const xpRules = [
    { label: "Build & Launch", xp: "+100", icon: Rocket, color: "#228be6" },
    { label: "Post Update", xp: "+50", icon: Plus, color: "#40c057" },
    { label: "Follow Fellow", xp: "+20", icon: ShareNetwork, color: "#7950f2" },
    { label: "Comment", xp: "+10", icon: ChatCircle, color: "#fab005" },
    { label: "Give Love", xp: "+5", icon: Heart, color: "#fa5252" },
    { label: "Streak Bonus", xp: "Multiplier", icon: Flame, color: "#fd7e14" },
  ];

  return (
    <div 
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        style={{
          background: "none",
          border: "none",
          padding: "4px",
          color: "var(--text-tertiary)",
          cursor: "help",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
          opacity: showTooltip ? 1 : 0.6,
        }}
      >
        <Info size={16} weight="regular" />
      </button>

      {showTooltip && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: "0",
          marginTop: "12px",
          width: "240px",
          backgroundColor: "var(--bg-page)",
          borderRadius: "var(--radius-md)",
          border: "0.5px solid var(--border-hairline)",
          boxShadow: "var(--shadow-lg)",
          padding: "20px",
          zIndex: 1000,
          animation: "tabContentEnter 0.2s ease-out",
        }}>
          {/* Tooltip Tip */}
          <div style={{
            position: "absolute",
            top: "-6px",
            right: "8px",
            width: "12px",
            height: "12px",
            backgroundColor: "var(--bg-page)",
            borderLeft: "0.5px solid var(--border-hairline)",
            borderTop: "0.5px solid var(--border-hairline)",
            transform: "rotate(45deg)",
          }} />

          <h4 style={{ 
            margin: "0 0 16px 0", 
            fontSize: "12px", 
            fontWeight: 800, 
            color: "var(--text-primary)",
            letterSpacing: "0.05em",
            textTransform: "uppercase"
          }}>
            How to earn XP
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {xpRules.map((rule, index) => (
              <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ 
                    width: "24px", 
                    height: "24px", 
                    borderRadius: "6px", 
                    backgroundColor: `${rule.color}10`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: rule.color
                  }}>
                    <rule.icon size={14} weight="bold" />
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                    {rule.label}
                  </span>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-primary)" }}>
                  {rule.xp}
                </span>
              </div>
            ))}
          </div>

          <div style={{ 
            marginTop: "16px", 
            paddingTop: "16px", 
            borderTop: "0.5px solid var(--border-hairline)",
            fontSize: "11px",
            color: "var(--text-tertiary)",
            lineHeight: 1.5,
            fontWeight: 500
          }}>
            Level up to unlock exclusive features and climb the Global Leaderboard.
          </div>
        </div>
      )}
    </div>
  );
}
