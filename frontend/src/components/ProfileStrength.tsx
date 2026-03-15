

import { Target, Info } from "phosphor-react";

interface ProfileStrengthProps {
  user: any;
  projectsCount: number;
}

export default function ProfileStrength({ user, projectsCount }: ProfileStrengthProps) {
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
      case "name": return "NAME";
      case "avatar": return "AVATAR";
      case "bio": return "BIO";
      case "job": return "JOB_TITLE";
      case "location": return "LOCATION";
      case "skills": return "SKILLS";
      case "socials": return "SOCIAL_LINKS";
      case "projects": return "SHIP_PROJECT";
      default: return "";
    }
  };

  return (
    <div style={{
      backgroundColor: "var(--bg-page)",
      border: "0.5px solid var(--border-hairline)",
      padding: "24px",
      marginBottom: "32px",
      borderRadius: "2px",
      position: "relative",
      overflow: "hidden"
    }}>
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
            borderRadius: "1px"
          }}>
            <Target size={18} weight="thin" color="var(--text-primary)" />
          </div>
          <div>
            <h3 style={{ 
              fontSize: "12px", 
              fontWeight: 800, 
              color: "var(--text-primary)", 
              margin: 0,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em",
              textTransform: "uppercase"
            }}>
              Identity Strength
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
              <Info size={12} weight="thin" color="var(--text-tertiary)" />
              <p style={{ 
                fontSize: "11px", 
                color: "var(--text-tertiary)", 
                margin: 0,
                fontFamily: "var(--font-mono)",
                fontWeight: 600
              }}>
                COMPLETE_ENGINE_INDEXING
              </p>
            </div>
          </div>
        </div>
        <div style={{
          fontSize: "20px",
          fontWeight: 900,
          color: "var(--text-primary)",
          fontFamily: "var(--font-mono)",
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
          fontSize: "10px", 
          fontFamily: "var(--font-mono)", 
          color: "var(--text-tertiary)", 
          fontWeight: 800,
          letterSpacing: "0.05em" 
        }}>
          PENDING_TASKS:
        </span>
        {missing.slice(0, 3).map(id => (
          <div 
            key={id} 
            className="strength-tag"
            style={{
              fontSize: "10px",
              fontWeight: 800,
              color: "var(--text-secondary)",
              padding: "4px 10px",
              backgroundColor: "transparent",
              borderRadius: "1px",
              border: "0.5px solid var(--border-hairline)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.05em"
            }}
          >
            {getMissingLabel(id)}
          </div>
        ))}
        {missing.length > 3 && (
          <div style={{ 
            fontSize: "10px", 
            fontWeight: 800, 
            color: "var(--text-tertiary)", 
            fontFamily: "var(--font-mono)",
            marginLeft: "2px" 
          }}>
            +{missing.length - 3}_MORE
          </div>
        )}
      </div>
    </div>
  );
}
