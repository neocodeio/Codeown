import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import api from "../api/axios";
import { SEO } from "../components/SEO";

const TOTAL_STEPS = 5;

const SKILL_OPTIONS = [
  "React", "TypeScript", "JavaScript", "Python", "Node.js",
  "Next.js", "Vue.js", "Go", "Rust", "Java",
  "C++", "Swift", "Kotlin", "Flutter", "Django",
  "Ruby on Rails", "PHP", "Laravel", "Docker", "AWS",
  "Firebase", "MongoDB", "PostgreSQL", "GraphQL", "Tailwind CSS",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useClerkUser();
  const { getToken, signOut } = useClerkAuth();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const [accessChecked, setAccessChecked] = useState(false);
  const [accessAllowed, setAccessAllowed] = useState(false);

  const [step, setStep] = useState(0);
  const [bio, setBio] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Access guard ---
  useEffect(() => {
    const checkAccess = async () => {
      // Wait for Clerk to load
      if (!isLoaded) return;

      // Not signed in → go to sign-in
      if (!isSignedIn || !user?.id) {
        navigate("/sign-in", { replace: true });
        return;
      }

      // Signed in → check if already completed onboarding
      try {
        const token = await getToken();
        if (!token) {
          navigate("/sign-in", { replace: true });
          return;
        }
        const res = await api.get(`/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data && res.data.onboarding_completed === true) {
          // Already completed → send to home
          navigate("/", { replace: true });
          return;
        }
        // Not completed → allow access
        setAccessAllowed(true);
      } catch {
        // If the user doesn't exist yet in DB, that means they're brand new → allow access
        setAccessAllowed(true);
      } finally {
        setAccessChecked(true);
      }
    };

    checkAccess();
  }, [isLoaded, isSignedIn, user?.id]);

  // Show loading while checking access
  if (!accessChecked || !accessAllowed) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100%",
        backgroundColor: "#fafbfc",
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          border: "3px solid #f3f3f3",
          borderTop: "3px solid #212121",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token || !user?.id) return;

      // Update profile with onboarding data
      await api.put(
        `/users/${user.id}`,
        {
          bio: bio || undefined,
          job_title: jobTitle || undefined,
          location: location || undefined,
          skills: selectedSkills.length > 0 ? selectedSkills : undefined,
          github_url: githubUrl ? (githubUrl.startsWith("http") ? githubUrl : `https://github.com/${githubUrl}`) : undefined,
          twitter_url: twitterUrl ? (twitterUrl.startsWith("http") ? twitterUrl : `https://x.com/${twitterUrl.replace("@", "")}`) : undefined,
          linkedin_url: linkedinUrl ? (linkedinUrl.startsWith("http") ? linkedinUrl : `https://linkedin.com/in/${linkedinUrl}`) : undefined,
          website_url: websiteUrl || undefined,
          onboarding_completed: true,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Also mark onboarding as complete via the dedicated endpoint
      await api.post(
        "/users/onboarding/complete",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.dispatchEvent(new Event("profileUpdated"));
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;

      await api.post(
        "/users/onboarding/complete",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.dispatchEvent(new Event("profileUpdated"));
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error skipping onboarding:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // --- Progress Dots ---
  const ProgressDots = () => (
    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === step ? "28px" : "8px",
            height: "8px",
            borderRadius: "100px",
            backgroundColor: i === step ? "#0f172a" : i < step ? "#94a3b8" : "#e2e8f0",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      ))}
    </div>
  );

  // --- Navigation Buttons ---
  const NavButtons = ({
    onNext,
    nextLabel = "Continue",
    showBack = true,
    disabled = false,
  }: {
    onNext: () => void;
    nextLabel?: string;
    showBack?: boolean;
    disabled?: boolean;
  }) => (
    <div
      style={{
        display: "flex",
        gap: "12px",
        justifyContent: "center",
        marginTop: "auto",
        paddingTop: "40px",
        paddingBottom: isMobile ? "32px" : "48px",
      }}
    >
      {showBack && (
        <button
          onClick={back}
          style={{
            padding: "12px 28px",
            borderRadius: "100px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#fff",
            color: "#64748b",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#cbd5e1";
            e.currentTarget.style.color = "#0f172a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.color = "#64748b";
          }}
        >
          Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={disabled}
        style={{
          padding: "12px 32px",
          borderRadius: "100px",
          border: "none",
          backgroundColor: disabled ? "#94a3b8" : "#0f172a",
          color: "#fff",
          fontSize: "15px",
          fontWeight: 700,
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "all 0.2s",
          opacity: disabled ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.backgroundColor = "#1e293b";
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.backgroundColor = "#0f172a";
        }}
      >
        {nextLabel}
        <span style={{ fontSize: "18px" }}>→</span>
      </button>
    </div>
  );

  // --- Input Styles ---
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 18px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    fontSize: "15px",
    fontWeight: 500,
    color: "#0f172a",
    backgroundColor: "#fff",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    color: "#64748b",
    marginBottom: "8px",
    display: "block",
  };

  // --- Steps ---
  const renderStep = () => {
    switch (step) {
      // Step 0: Welcome
      case 0:
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              flex: 1,
              padding: isMobile ? "0 20px" : "0 40px",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#6366f1",
                letterSpacing: "0.05em",
                marginBottom: "16px",
              }}
            >
              Welcome to Codeown!
            </p>
            <h1
              style={{
                fontSize: isMobile ? "32px" : "44px",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.15,
                marginBottom: "20px",
                letterSpacing: "-0.03em",
              }}
            >
              The home for developers
            </h1>
            <p
              style={{
                fontSize: "16px",
                color: "#64748b",
                lineHeight: 1.6,
                maxWidth: "420px",
              }}
            >
              Let's set up your profile so you can launch your projects and get
              discovered by the community.
            </p>
            <NavButtons onNext={next} showBack={false} nextLabel="Continue" />
          </div>
        );

      // Step 1: Features
      case 1: {
        const features = [
          { label: "Launch Projects", color: "#f59e0b", bg: "#fffbeb" },
          { label: "Get Discovered", color: "#8b5cf6", bg: "#f5f3ff" },
          { label: "Build in Public", color: "#ef4444", bg: "#fef2f2" },
          { label: "Connect", color: "#3b82f6", bg: "#eff6ff" },
          { label: "Grow Audience", color: "#10b981", bg: "#ecfdf5" },
          { label: "and much more", color: "#64748b", bg: "#f8fafc" },
        ];
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: isMobile ? "0 20px" : "0 40px",
              maxWidth: "520px",
              margin: "0 auto",
              width: "100%",
            }}
          >
            <h1
              style={{
                fontSize: isMobile ? "28px" : "36px",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.15,
                marginBottom: "14px",
                letterSpacing: "-0.03em",
              }}
            >
              Your Launchpad Awaits.
            </h1>
            <p
              style={{
                fontSize: "15px",
                color: "#64748b",
                lineHeight: 1.6,
                marginBottom: "28px",
              }}
            >
              Codeown is where developers showcase their projects and get
              discovered by the world. Here you can
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
              {features.map((f) => (
                <span
                  key={f.label}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "100px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: f.color,
                    backgroundColor: f.bg,
                    border: `1px solid ${f.color}20`,
                  }}
                >
                  {f.label}
                </span>
              ))}
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "#94a3b8",
                fontStyle: "italic",
              }}
            >
              Complete your profile to join the community of ambitious
              developers!
            </p>
            <NavButtons onNext={next} nextLabel="Start onboarding" />
          </div>
        );
      }

      // Step 2: Bio + Job Title + Location
      case 2:
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: isMobile ? "0 20px" : "0 40px",
              maxWidth: "520px",
              margin: "0 auto",
              width: "100%",
            }}
          >
            <h1
              style={{
                fontSize: isMobile ? "28px" : "36px",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.15,
                marginBottom: "8px",
                letterSpacing: "-0.03em",
              }}
            >
              Tell us about yourself
            </h1>
            <p
              style={{
                fontSize: "15px",
                color: "#94a3b8",
                marginBottom: "32px",
              }}
            >
              A few details to help others know you better.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={labelStyle}>
                  Job title <span style={{ color: "#cbd5e1", fontWeight: 500 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full Stack Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#6366f1";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Location <span style={{ color: "#cbd5e1", fontWeight: 500 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#6366f1";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={labelStyle}>
                    Brief bio <span style={{ color: "#cbd5e1", fontWeight: 500 }}>(optional)</span>
                  </label>
                  <span style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 500 }}>
                    {bio.length}/160
                  </span>
                </div>
                <textarea
                  placeholder="Brief bio about yourself..."
                  value={bio}
                  onChange={(e) => {
                    if (e.target.value.length <= 160) setBio(e.target.value);
                  }}
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: "none",
                    lineHeight: 1.6,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#6366f1";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <NavButtons onNext={next} />
          </div>
        );

      // Step 3: Skills
      case 3:
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: isMobile ? "0 20px" : "0 40px",
              maxWidth: "520px",
              margin: "0 auto",
              width: "100%",
            }}
          >
            <h1
              style={{
                fontSize: isMobile ? "28px" : "36px",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.15,
                marginBottom: "8px",
                letterSpacing: "-0.03em",
              }}
            >
              What's your stack?
            </h1>
            <p
              style={{
                fontSize: "15px",
                color: "#94a3b8",
                marginBottom: "28px",
              }}
            >
              Pick your favorite technologies to personalize your experience.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
              {SKILL_OPTIONS.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "100px",
                      fontSize: "14px",
                      fontWeight: 600,
                      border: isSelected ? "1.5px solid #0f172a" : "1px solid #e2e8f0",
                      backgroundColor: isSelected ? "#0f172a" : "#fff",
                      color: isSelected ? "#fff" : "#475569",
                      cursor: "pointer",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      transform: isSelected ? "scale(1.04)" : "scale(1)",
                    }}
                  >
                    {isSelected && "✓ "}
                    {skill}
                  </button>
                );
              })}
            </div>

            {selectedSkills.length > 0 && (
              <p style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 500 }}>
                {selectedSkills.length} selected
              </p>
            )}

            <NavButtons onNext={next} />
          </div>
        );

      // Step 4: Social Links
      case 4:
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: isMobile ? "0 20px" : "0 40px",
              maxWidth: "520px",
              margin: "0 auto",
              width: "100%",
            }}
          >
            <h1
              style={{
                fontSize: isMobile ? "28px" : "36px",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.15,
                marginBottom: "8px",
                letterSpacing: "-0.03em",
              }}
            >
              Almost there!
            </h1>
            <p
              style={{
                fontSize: "15px",
                color: "#94a3b8",
                marginBottom: "32px",
              }}
            >
              Add your social links so people can connect with you.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={labelStyle}>
                  GitHub <span style={{ color: "#cbd5e1", fontWeight: 500 }}>(optional)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                      fontSize: "14px",
                      fontWeight: 500,
                      pointerEvents: "none",
                    }}
                  >
                    github.com/
                  </span>
                  <input
                    type="text"
                    placeholder="username"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: "112px" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#6366f1";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  X (Twitter) <span style={{ color: "#cbd5e1", fontWeight: 500 }}>(optional)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                      fontSize: "14px",
                      fontWeight: 500,
                      pointerEvents: "none",
                    }}
                  >
                    @
                  </span>
                  <input
                    type="text"
                    placeholder="username"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: "36px" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#6366f1";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  LinkedIn <span style={{ color: "#cbd5e1", fontWeight: 500 }}>(optional)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                      fontSize: "14px",
                      fontWeight: 500,
                      pointerEvents: "none",
                    }}
                  >
                    linkedin.com/in/
                  </span>
                  <input
                    type="text"
                    placeholder="username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: "134px" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#6366f1";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  Website <span style={{ color: "#cbd5e1", fontWeight: 500 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="https://yoursite.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#6366f1";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                marginTop: "auto",
                paddingTop: "40px",
                paddingBottom: isMobile ? "32px" : "48px",
              }}
            >
              <button
                onClick={back}
                style={{
                  padding: "12px 28px",
                  borderRadius: "100px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#fff",
                  color: "#64748b",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.color = "#0f172a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                style={{
                  padding: "12px 32px",
                  borderRadius: "100px",
                  border: "none",
                  backgroundColor: isSubmitting ? "#94a3b8" : "#0f172a",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) e.currentTarget.style.backgroundColor = "#1e293b";
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) e.currentTarget.style.backgroundColor = "#0f172a";
                }}
              >
                {isSubmitting ? "Setting up..." : "Complete Profile"}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: "100vh",
        backgroundColor: "#fafbfc",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <SEO title="Welcome to Codeown" description="Set up your developer profile on Codeown." />

      <style>{`
        @keyframes onboardingFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .onboarding-step-content {
          animation: onboardingFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: isMobile ? "16px 20px" : "20px 40px",
          position: "relative",
        }}
      >
        <div style={{ width: "80px" }} /> {/* spacer */}
        <ProgressDots />
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={handleSkip}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#64748b")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            Skip
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#64748b")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <div
        className="onboarding-step-content"
        key={step}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: step === 0 ? "center" : "flex-start",
          paddingTop: step === 0 ? "0" : isMobile ? "32px" : "60px",
          maxWidth: "680px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {renderStep()}
      </div>
    </div>
  );
}
