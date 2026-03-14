

interface ProfileStrengthProps {
  user: any;
  projectsCount: number;
}

export default function ProfileStrength({ user, projectsCount }: ProfileStrengthProps) {
  const calculateStrength = () => {
    let score = 0;
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
    score = completed.reduce((acc, item) => acc + item.weight, 0);

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
      case "name": return "Add your name";
      case "avatar": return "Upload an avatar";
      case "bio": return "Write a bio";
      case "job": return "Add job title";
      case "location": return "Set your location";
      case "skills": return "Add skills";
      case "socials": return "Connect socials";
      case "projects": return "Launch a project";
      default: return "";
    }
  };

  return (
    <div style={{
      backgroundColor: "#fff",
      borderRadius: "24px",
      padding: "24px",
      border: "1px solid #f1f5f9",
      marginBottom: "32px",
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Profile Strength</h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
            Complete your profile to get discovered more.
          </p>
        </div>
        <div style={{
          fontSize: "18px",
          fontWeight: 900,
          color: score > 70 ? "#059669" : score > 40 ? "#d97706" : "#6366f1"
        }}>
          {score}%
        </div>
      </div>

      <div style={{
        width: "100%",
        height: "8px",
        backgroundColor: "#f1f5f9",
        borderRadius: "100px",
        overflow: "hidden",
        marginBottom: "20px"
      }}>
        <div style={{
          width: `${score}%`,
          height: "100%",
          backgroundColor: score > 70 ? "#059669" : score > 40 ? "#d97706" : "#6366f1",
          borderRadius: "100px",
          transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
        }} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {missing.slice(0, 3).map(id => (
          <div key={id} style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#64748b",
            padding: "6px 12px",
            backgroundColor: "#f8fafc",
            borderRadius: "100px",
            border: "1px solid #f1f5f9"
          }}>
            + {getMissingLabel(id)}
          </div>
        ))}
        {missing.length > 3 && (
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", alignSelf: "center", marginLeft: "4px" }}>
            and {missing.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}
