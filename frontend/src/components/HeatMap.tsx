import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useWindowSize } from "../hooks/useWindowSize";

interface HeatMapProps {
  userId: string;
  githubUrl?: string | null;
}

interface ActivityDay {
  date: string;
  count: number;
  source: "codeown" | "github" | "both";
}

export const HeatMap: React.FC<HeatMapProps> = ({ userId, githubUrl }) => {
  const [data, setData] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  if (!githubUrl) return null;

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        // 1. Fetch Codeown Activity
        const codeownRes = await api.get(`/analytics/heatmap/${userId}`);
        const codeownData: { date: string; count: number }[] = codeownRes.data;

        // 2. Fetch GitHub Activity if URL exists
        let githubData: Record<string, number> = {};
        if (githubUrl) {
          try {
            // Robust parsing: extract "username" from "https://github.com/username/", "github.com/username", etc.
            let githubUsername = githubUrl.trim().replace(/\/$/, "").split("/").pop();
            
            if (githubUsername && githubUsername !== "github.com" && !githubUsername.includes("http")) {
              const ghRes = await fetch(`https://api.github.com/users/${githubUsername}/events/public`);
              if (ghRes.ok) {
                const ghEvents = await ghRes.json();
                if (Array.isArray(ghEvents)) {
                    ghEvents.forEach((event: any) => {
                      if (event.created_at) {
                        const date = event.created_at.split("T")[0];
                        githubData[date] = (githubData[date] || 0) + 1;
                      }
                    });
                }
              }
            }
          } catch (err) {
            console.warn("Could not fetch GitHub activity:", err);
          }
        }

        // 3. Merge data
        const merged: Record<string, ActivityDay> = {};
        
        // Add Codeown activity
        codeownData.forEach(day => {
          merged[day.date] = {
            date: day.date,
            count: day.count,
            source: "codeown"
          };
        });

        // Merge GitHub activity
        Object.entries(githubData).forEach(([date, count]) => {
          if (merged[date]) {
            merged[date].count += count;
            merged[date].source = "both";
          } else {
            merged[date] = {
              date,
              count,
              source: "github"
            };
          }
        });

        const finalData = Object.values(merged).sort((a, b) => a.date.localeCompare(b.date));
        setData(finalData);
      } catch (error) {
        console.error("Error fetching heatmap:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [userId, githubUrl]);

  // Generate last 365 days of empty squares
  const renderSquares = () => {
    const squares: React.ReactElement[] = [];
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(today.getDate() - (364 - i));
        const dateStr = d.toISOString().split('T')[0];
        const dayData = data.find(day => day.date === dateStr);
        
        const count = dayData?.count || 0;
        let color = "var(--bg-hover)";
        let opacity = 0.2;
        
        if (count > 0) {
            if (dayData?.source === 'github') color = "#238636"; // GitHub Green
            else if (dayData?.source === 'codeown') color = "var(--text-primary)"; // Codeown Theme Color
            else color = "var(--text-primary)"; // Mixed

            if (count > 10) opacity = 1;
            else if (count > 5) opacity = 0.7;
            else opacity = 0.4;
        }

        squares.push(
            <div
                key={i}
                title={`${dateStr}: ${count} activities`}
                style={{
                    width: "10px",
                    height: "10px",
                    backgroundColor: color,
                    opacity: opacity,
                    borderRadius: "2px",
                }}
            />
        );
    }
    return squares;
  };

  if (loading) {
    return <div style={{ height: "100px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontSize: "12px" }}>Loading contributions...</div>;
  }

  return (
    <div style={{ 
      padding: isMobile ? "20px" : "24px", 
      borderRadius: "16px", 
      border: "0.5px solid var(--border-hairline)", 
      backgroundColor: "var(--bg-card)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
            Contributions
          </h4>
          <span style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-tertiary)", opacity: 0.6 }}>in the last year</span>
        </div>
        <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 500 }}>
           <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
             <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#238636" }} /> GitHub
           </span>
           <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
             <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "var(--text-primary)" }} /> Codeown
           </span>
        </div>
      </div>
      <div style={{ 
          overflowX: "auto",
          width: "100%",
          paddingBottom: "4px",
          msOverflowStyle: "none",
          scrollbarWidth: "none"
      }} className="hide-scrollbar">
        <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(52, 1fr)", 
            gridTemplateRows: "repeat(7, 1fr)",
            gridAutoFlow: "column",
            gap: "3.5px",
            minWidth: "720px",
            width: "max-content"
        }}>
          {renderSquares()}
        </div>
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .activity-square:hover { transform: scale(1.15); z-index: 10; border-radius: 4px !important; }
      `}</style>
    </div>
  );
};
