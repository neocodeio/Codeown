import React, { useState } from "react";
import { ShareNetwork } from "phosphor-react";
import { ShareCardModal } from "./ShareCardModal";

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
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
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
      >
        <ShareNetwork size={18} weight="bold" />
        Share Stats Card
      </button>

      <ShareCardModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        stats={stats}
        title={title}
      />
    </>
  );
};
