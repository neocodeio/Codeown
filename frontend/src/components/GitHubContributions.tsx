import React, { useEffect, useState, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { GithubIcon } from "@hugeicons/core-free-icons";
import { useWindowSize } from "../hooks/useWindowSize";

interface GitHubContributionsProps {
  githubUrl: string | null;
}

interface Contribution {
  date: string;
  count: number;
  level: number;
}

interface GitHubData {
  total: number;
  contributions: Contribution[];
  repos: number;
}

export const GitHubContributions: React.FC<GitHubContributionsProps> = ({ githubUrl }) => {
  const [data, setData] = useState<GitHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!githubUrl) return;

    const fetchGitHubData = async () => {
      try {
        setLoading(true);
        const username = githubUrl.trim().replace(/\/$/, "").split("/").pop();
        if (!username || username === "github.com") return;

        // Fetch user data for repo count
        const userRes = await fetch(`https://api.github.com/users/${username}`);
        const userData = await userRes.json();

        // Fetch contributions using a reliable proxy API
        const contribRes = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
        const contribData = await contribRes.json();

        if (contribData && contribData.contributions) {
            setData({
                total: contribData.total.lastYear || 0,
                contributions: contribData.contributions,
                repos: userData.public_repos || 0
            });
        }
      } catch (error) {
        console.error("Error fetching GitHub contributions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubData();
  }, [githubUrl]);

  // Center scroll on effect end
  useEffect(() => {
    if (scrollRef.current && !loading && !isMobile) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [loading, isMobile]);

  if (!githubUrl || (!loading && !data)) return null;

  if (loading) {
    return (
      <div style={{ 
        padding: isMobile ? "16px" : "24px",
        border: "0.5px solid var(--border-hairline)",
        borderRadius: "16px",
        backgroundColor: "var(--bg-page)",
        marginBottom: "24px"
      }}>
        <div className="skeleton-pulse" style={{ height: "20px", width: "100px", marginBottom: "12px", borderRadius: "4px" }} />
        <div className="skeleton-pulse" style={{ height: "32px", width: "240px", marginBottom: "20px", borderRadius: "4px" }} />
        <div className="skeleton-pulse" style={{ height: "120px", width: "100%", borderRadius: "4px" }} />
      </div>
    );
  }

  if (!data) return null;

  // Group contributions by month for labels
  const monthLabels: { label: string; index: number }[] = [];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  if (data.contributions.length > 0) {
    let lastMonth = -1;
    data.contributions.forEach((c, i) => {
        const date = new Date(c.date);
        const month = date.getMonth();
        if (month !== lastMonth && i % 7 === 0) {
            monthLabels.push({ label: months[month], index: Math.floor(i / 7) });
            lastMonth = month;
        }
    });
  }

  return (
    <div style={{ 
      padding: isMobile ? "12px" : "16px",
      border: "0.5px solid var(--border-hairline)",
      borderRadius: "12px",
      backgroundColor: "var(--bg-page)",
      marginBottom: "20px",
      width: "100%",
      boxSizing: "border-box",
      fontFamily: "var(--font-main, Inter, -apple-system, sans-serif)"
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
        <HugeiconsIcon icon={GithubIcon} size={20} />
        <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)" }}>GitHub</span>
      </div>

      {/* Main Stat */}
      <div style={{ marginBottom: "16px" }}>
        <h2 style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 800, margin: 0, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          {data.total.toLocaleString()} <span style={{ fontWeight: 500, color: "var(--text-secondary)" }}>Contributions in the last year</span>
        </h2>
      </div>

      {/* Heatmap Grid Container */}
      <div 
        ref={scrollRef}
        style={{ 
          width: "100%",
          overflowX: "auto",
          paddingBottom: "8px",
          position: "relative"
        }}
        className="no-scrollbar"
      >
        <div style={{ minWidth: "max-content" }}>
            {/* Month Labels */}
            <div style={{ 
                display: "flex", 
                marginBottom: "6px", 
                marginLeft: "0px",
                height: "12px",
                position: "relative"
            }}>
                {monthLabels.map((m, i) => (
                    <span key={i} style={{ 
                        position: "absolute", 
                        left: `${m.index * 10}px`, // 8px square + 2px gap
                        fontSize: "9px", 
                        color: "var(--text-tertiary)",
                        fontWeight: 600
                    }}>
                        {m.label}
                    </span>
                ))}
            </div>

            {/* Squares Grid */}
            <div style={{ 
                display: "grid", 
                gridTemplateColumns: `repeat(${Math.ceil(data.contributions.length / 7)}, 8px)`, 
                gridTemplateRows: "repeat(7, 8px)",
                gridAutoFlow: "column",
                gap: "2px"
            }}>
                {data.contributions.map((c, i) => {
                    // GitHub legacy colors
                    const colors = ["var(--bg-hover)", "#0e4429", "#006d32", "#26a641", "#39d353"];
                    return (
                        <div
                            key={i}
                            title={`${c.date}: ${c.count} contributions`}
                            style={{
                                width: "8px",
                                height: "8px",
                                backgroundColor: colors[c.level] || colors[0],
                                borderRadius: "1.5px",
                                transition: "all 0.1s ease"
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = "scale(1.2)";
                                e.currentTarget.style.zIndex = "10";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.zIndex = "1";
                            }}
                        />
                    );
                })}
            </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "12px", borderTop: "0.5px solid var(--border-hairline)", paddingTop: "10px" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Total <span style={{ color: "var(--text-primary)" }}>{data.repos}</span> repositories
        </p>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
