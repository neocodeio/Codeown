import React, { useEffect, useState, useRef } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mouse Drag to Scroll Logic
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    if (scrollRef.current && !loading) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [loading, data]);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const codeownRes = await api.get(`/analytics/heatmap/${userId}`);
        const codeownData: { date: string; count: number }[] = codeownRes.data;

        let githubData: Record<string, number> = {};
        if (githubUrl) {
          try {
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

        const merged: Record<string, ActivityDay> = {};
        codeownData.forEach(day => {
          merged[day.date] = { date: day.date, count: day.count, source: "codeown" };
        });

        Object.entries(githubData).forEach(([date, count]) => {
          if (merged[date]) {
            merged[date].count += count;
            merged[date].source = "both";
          } else {
            merged[date] = { date, count, source: "github" };
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

  const totalContributions = data.reduce((acc, curr) => acc + curr.count, 0);

  const renderSquares = () => {
    const squares: React.ReactElement[] = [];
    const today = new Date();
    for (let i = 0; i < 364; i++) {
        const d = new Date();
        d.setDate(today.getDate() - (363 - i));
        const dateStr = d.toISOString().split('T')[0];
        const dayData = data.find(day => day.date === dateStr);
        const count = dayData?.count || 0;
        let color = "var(--bg-hover)";
        let opacity = 0.3;
        
        if (count > 0) {
            if (dayData?.source === 'github') color = "#238636";
            else if (dayData?.source === 'codeown') color = "var(--text-primary)";
            else color = "var(--text-primary)";

            if (count > 10) opacity = 1;
            else if (count > 5) opacity = 0.7;
            else opacity = 0.45;
        }

        squares.push(
            <div
                key={i}
                title={`${dateStr}: ${count} activities`}
                className="activity-square"
                style={{
                    width: "9px",
                    height: "9px",
                    backgroundColor: color,
                    opacity: opacity,
                    borderRadius: "2px",
                    transition: "all 0.2s ease"
                }}
            />
        );
    }
    return squares;
  };

  if (!githubUrl && data.length === 0) return null;

  if (loading) {
    return (
      <div style={{ padding: "0 24px" }}>
        <div style={{ height: "140px", width: "100%", maxWidth: "680px", margin: "0 auto", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-md)", animation: "skeleton-shimmer 1.5s infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ 
      width: "100%",
      display: "flex",
      justifyContent: "center",
      padding: isMobile ? "0 10px" : "0"
    }}>
      <div style={{ 
        width: "100%",
        maxWidth: "680px", // Exact width for centered feel
        padding: isMobile ? "20px" : "24px", 
        borderRadius: "var(--radius-md)", 
        border: "0.5px solid var(--border-hairline)", 
        backgroundColor: "var(--bg-page)",
        boxShadow: "var(--shadow-sm)"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "flex-end", 
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                {totalContributions} Contributions
              </h4>
            </div>
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 500 }}>in the last year</span>
          </div>
          
          <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 500, opacity: 0.8 }}>
             <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
               <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#238636" }} /> GitHub
             </span>
             <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
               <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "var(--text-primary)" }} /> Codeown
             </span>
          </div>
        </div>

        <div 
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          style={{ 
            overflowX: "auto",
            width: "100%",
            paddingBottom: "4px",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none"
          }} 
          className="hide-scrollbar"
        >
          <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(52, 1fr)", 
              gridTemplateRows: "repeat(7, 1fr)",
              gridAutoFlow: "column",
              gap: "3px",
              minWidth: "640px",
              width: "max-content"
          }}>
            {renderSquares()}
          </div>
        </div>
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .activity-square:hover { transform: scale(1.3); z-index: 10; opacity: 1 !important; border-radius: 3px !important; }
        `}</style>
      </div>
    </div>
  );
};
