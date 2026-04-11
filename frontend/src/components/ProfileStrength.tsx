

import { Target, Info } from "phosphor-react";

interface ProfileStrengthProps {
  user: any;
  projectsCount: number;
  standalone?: boolean;
}

export default function ProfileStrength({ user, projectsCount, standalone }: ProfileStrengthProps) {
  const calculateStrength = () => {
    const items = [
      { id: "name", weight: 10, check: () => !!user?.name },
      { id: "avatar", weight: 10, check: () => !!user?.avatar_url },
      { id: "bio", weight: 15, check: () => !!user?.bio },
      { id: "job", weight: 10, check: () => !!user?.job_title },
      { id: "location", weight: 10, check: () => !!user?.location },
      { id: "skills", weight: 15, check: () => user?.skills && user.skills.length > 0 },
      { id: "socials", weight: 15, check: () => !!(user?.github_url || user?.twitter_url || user?.linkedin_url || user?.website_url) },
      { id: "projects", weight: 15, check: () => projectsCount > 0 },
    ];

    const completed = items.filter(item => item.check());
    const score = completed.reduce((acc, item) => acc + item.weight, 0);

    return {
      score,
      total: 100,
      missing: items.filter(item => !item.check()).map(item => item.id),
    };
  };

  const { score, missing } = calculateStrength();

  if (score === 100) return null;

  const getMissingLabel = (id: string) => {
    switch (id) {
      case "name": return "Name";
      case "avatar": return "Avatar";
      case "bio": return "Bio";
      case "job": return "Job title";
      case "location": return "Location";
      case "skills": return "Skills";
      case "socials": return "Social links";
      case "projects": return "Ship project";
      default: return "";
    }
  };

  const content = (
    <>
      <style>{`
        .strength-tag {
          transition: all 0.2s ease;
          cursor: default;
        }
        .strength-tag:hover {
          background-color: var(--bg-hover) !important;
          border-color: var(--text-secondary) !important;
          color: var(--text-primary) !important;
        }
      `}</style>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ 
            width: "36px", 
            height: "36px", 
            backgroundColor: "var(--bg-hover)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            border: "0.5px solid var(--border-hairline)",
            borderRadius: "var(--radius-xs)"
          }}>
            <Target size={18} weight="thin" color="var(--text-primary)" />
          </div>
          <div>
            <h3 style={{ 
              fontSize: "14px", 
              fontWeight: 700, 
              color: "var(--text-primary)", 
              margin: 0,
            }}>
              Identity strength
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
              <Info size={12} weight="thin" color="var(--text-tertiary)" />
              <p style={{ 
                fontSize: "11px", 
                color: "var(--text-tertiary)", 
                margin: 0,
                fontWeight: 500
              }}>
                Complete engine indexing
              </p>
            </div>
          </div>
        </div>
        <div style={{
          fontSize: "20px",
          fontWeight: 800,
          color: "var(--text-primary)",
          letterSpacing: "-0.05em"
        }}>
          {score}%
        </div>
      </div>

      <div style={{
        width: "100%",
        height: "4px",
        backgroundColor: "var(--bg-hover)",
        borderRadius: "0px",
        overflow: "hidden",
        marginBottom: "24px",
        border: "0.5px solid var(--border-hairline)"
      }}>
        <div style={{
          width: `${score}%`,
          height: "100%",
          backgroundColor: score > 70 ? "#22c55e" : score > 40 ? "#f59e0b" : "var(--text-primary)",
          transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: score > 70 ? "0 0 10px rgba(34, 197, 94, 0.2)" : "none"
        }} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
        <span style={{ 
          fontSize: "11px", 
          color: "var(--text-tertiary)", 
          fontWeight: 600,
        }}>
          Pending tasks:
        </span>
        {missing.slice(0, 3).map(id => (
          <div 
            key={id} 
            className="strength-tag"
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--text-secondary)",
              padding: "4px 10px",
              backgroundColor: "transparent",
              borderRadius: "var(--radius-xs)",
              border: "0.5px solid var(--border-hairline)",
            }}
          >
            {getMissingLabel(id).toUpperCase()}
          </div>
        ))}
        {missing.length > 3 && (
          <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>
            +{missing.length - 3} MORE
          </span>
        )}
      </div>
    </>
  );

  if (standalone) return <div style={{ width: "100%" }}>{content}</div>;

  return (
    <div style={{
      backgroundColor: "var(--bg-page)",
      border: "0.5px solid var(--border-hairline)",
      padding: "24px",
      marginBottom: "32px",
      borderRadius: "var(--radius-sm)",
      position: "relative",
      overflow: "hidden"
    }}>
      {content}
    </div>
  );
}
