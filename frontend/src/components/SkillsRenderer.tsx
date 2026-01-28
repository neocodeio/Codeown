
interface SkillsRendererProps {
    skills: string[];
}

export default function SkillsRenderer({ skills }: SkillsRendererProps) {

    if (!skills || skills.length === 0) return null;

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
            {skills.map((skill, index) => (
                <span
                    key={index}
                    onClick={(e) => {
                        e.stopPropagation();
                        // Navigate to search or relevant page for skill
                        // navigate(`/search?q=${skill}`); 
                    }}
                    style={{
                        padding: "6px 12px",
                        backgroundColor: "#f1f5f9",
                        color: "#475569",
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: 600,
                        border: "1px solid #e2e8f0",
                        // cursor: "pointer", // Enable if navigation is added
                    }}
                // onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e2e8f0"} // Enable if navigation is added
                // onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"} // Enable if navigation is added
                >
                    {skill}
                </span>
            ))}
        </div>
    );
}
