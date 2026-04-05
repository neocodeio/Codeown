import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import { 
  Trophy, 
  Medal, 
  Plus, 
  PaperPlaneTilt, 
  ArrowUp,
  CheckCircle,
  Clock,
  GithubLogo,
  Globe,
  Info
} from "phosphor-react";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import LaunchCompetitionModal from "../components/LaunchCompetitionModal";
import SubmitProjectModal from "../components/SubmitProjectModal";
import GoldenShipBadge from "../components/GoldenShipBadge";
import { useWindowSize } from "../hooks/useWindowSize";

export default function ShipWeek() {
  const { user, isSignedIn } = useClerkUser();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 1024;

  const [competition, setCompetition] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [hallOfFame, setHallOfFame] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.username === "amin.ceo";

  const safeFormatDistance = (dateStr: string) => {
    if (!dateStr) return "...";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "...";
      return formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return "...";
    }
  };

  useEffect(() => {
    fetchData();
  }, [isSignedIn]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compRes, hofRes] = await Promise.all([
        api.get("/ship/active"),
        api.get("/ship/hall-of-fame")
      ]);
      setCompetition(compRes.data);
      const hof = Array.isArray(hofRes.data) ? hofRes.data : [];
      setHallOfFame(hof);

      if (compRes.data && isSignedIn) {
        const token = await getToken();
        const eligRes = await api.get(`/ship/eligibility/${compRes.data.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEligibility(eligRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch ship week data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!isSignedIn) return navigate("/sign-in");
    setIsJoining(true);
    try {
      const token = await getToken();
      await api.post(`/ship/join/${competition.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Welcome to the competition! Time to ship. 🚀");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to join");
    } finally {
      setIsJoining(false);
    }
  };

  const handleVote = async (submissionId: string) => {
    if (!isSignedIn) return navigate("/sign-in");
    try {
      const token = await getToken();
      await api.post(`/ship/vote/${submissionId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Vote recorded!");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to vote");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div style={{
          width: "24px",
          height: "24px",
          border: "2px solid var(--border-hairline)",
          borderTopColor: "var(--text-primary)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: "1100px", 
      margin: "0 auto", 
      padding: isMobile ? "24px 16px" : "48px 24px",
      minHeight: "100vh"
    }}>
      <style>{`
        .ship-week-container {
          display: grid;
          grid-template-columns: ${isMobile ? "1fr" : "1fr 320px"};
          gap: 32px;
        }
        
        .hero-section {
          background: var(--bg-card);
          border: 1px solid var(--border-hairline);
          border-radius: 24px;
          padding: ${isMobile ? "32px 20px" : "48px 40px"};
          margin-bottom: 32px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .hero-glow {
          position: absolute;
          top: -20%;
          right: -10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(var(--text-primary-rgb), 0.03) 0%, transparent 70%);
          pointer-events: none;
        }

        .stat-pill {
          background: var(--bg-hover);
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          border: 1px solid var(--border-hairline);
        }

        .submission-grid {
          display: grid;
          grid-template-columns: ${width < 640 ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))"};
          gap: 20px;
        }

        .submission-card {
          background: var(--bg-card);
          border: 1.5px solid var(--border-hairline);
          border-radius: 20px;
          padding: 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .submission-card:hover {
          border-color: var(--text-primary);
          box-shadow: 0 12px 30px -10px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }

        .hof-item {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 16px;
          overflow: hidden;
          border: 2px solid var(--border-hairline);
          transition: all 0.2s ease;
          position: relative;
        }

        .hof-item:hover {
          border-color: #FFD700;
          transform: scale(1.05);
          z-index: 10;
        }

        .btn-primary {
          background: var(--text-primary);
          color: var(--bg-page);
          border: none;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .btn-primary:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: transparent;
          color: var(--text-primary);
          border: 1px solid var(--border-hairline);
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: var(--bg-hover);
        }

        .progress-bar-container {
          width: 100%;
          height: 10px;
          background: var(--bg-hover);
          border-radius: 99px;
          overflow: hidden;
          margin: 16px 0;
          border: 1px solid var(--border-hairline);
        }

        .progress-bar-fill {
          height: 100%;
          background: var(--text-primary);
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        h2.section-title {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .sidebar-widget {
          background: var(--bg-card);
          border: 1px solid var(--border-hairline);
          border-radius: 20px;
          padding: 28px;
          margin-bottom: 24px;
        }

        .tooltip-container {
          position: relative;
          cursor: pointer;
        }

        .tooltip-box {
          position: absolute;
          bottom: 100%;
          right: 0;
          width: 200px;
          background: var(--bg-card);
          border: 1px solid var(--border-hairline);
          padding: 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(10px) scale(0.95);
          z-index: 50;
          margin-bottom: 8px;
          pointer-events: none;
        }

        .tooltip-box::after {
          content: '';
          position: absolute;
          top: 100%;
          right: 4px;
          border: 6px solid transparent;
          border-top-color: var(--border-hairline);
        }

        .tooltip-container:hover .tooltip-box {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
        }
      `}</style>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-glow" />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: isMobile ? "flex-start" : "center", gap: "12px", marginBottom: "24px" }}>
            <span className="stat-pill"><Trophy size={16} weight="bold" /> Ship Week #1</span>
            <span className="stat-pill" style={{ color: "#FFD700", background: "rgba(255, 215, 0, 0.05)", borderColor: "rgba(255, 215, 0, 0.2)" }}>
              <Medal size={16} weight="fill" /> Golden Badge Award
            </span>
          </div>
          
          <h1 style={{ 
            fontSize: isMobile ? "32px" : "48px", 
            fontWeight: 900, 
            marginBottom: "16px", 
            letterSpacing: "-0.04em",
            textAlign: isMobile ? "left" : "center"
          }}>
            {competition?.name || "The Ship Week"}
          </h1>
          <p style={{ 
            fontSize: isMobile ? "16px" : "18px", 
            color: "var(--text-secondary)", 
            maxWidth: "640px", 
            margin: isMobile ? "0 0 32px" : "0 auto 32px",
            textAlign: isMobile ? "left" : "center",
            lineHeight: 1.6
          }}>
            {competition?.description || "Build one major feature. Ship daily updates. Win eternal glory and the legendary Golden Ship Badge."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "flex-start" : "center", gap: "24px" }}>
            {competition ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", fontWeight: 700, color: "var(--text-tertiary)" }}>
                  <Clock size={20} weight="bold" />
                  <span>Competition ends {safeFormatDistance(competition.end_date)}</span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", width: isMobile ? "100%" : "auto" }}>
                  {!isSignedIn ? (
                    <button className="btn-primary" style={{ width: isMobile ? "100%" : "auto" }} onClick={() => navigate("/sign-in")}>Sign in to Join</button>
                  ) : (
                    <>
                      <button 
                        className="btn-primary" 
                        onClick={handleJoin} 
                        disabled={isJoining}
                        style={{ 
                          width: isMobile ? "200px" : "auto",
                          opacity: isJoining ? 0.7 : 1 
                        }}
                      >
                        {isJoining ? "Joining..." : "Join Competition"}
                      </button>
                      {isAdmin && (
                        <button className="btn-secondary" onClick={() => setIsLaunchModalOpen(true)}>
                          <Plus size={18} weight="bold" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              isAdmin && <button className="btn-primary" onClick={() => setIsLaunchModalOpen(true)}>Launch Season 1</button>
            )}
          </div>
        </div>
      </div>

      <div className="ship-week-container">
        {/* Main Content: Submissions */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
            <h2 className="section-title">
              Submissions <span style={{ color: "var(--text-tertiary)", fontWeight: 500, fontSize: "14px" }}>({(Array.isArray(competition?.submissions) ? competition.submissions : []).length})</span>
            </h2>
          </div>

          <div className="submission-grid">
            {(Array.isArray(competition?.submissions) ? competition.submissions : []).filter((s: any) => s && s.user).map((sub: any) => (
              <motion.div 
                key={sub.id} 
                className="submission-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <img src={sub.user?.avatar_url || ''} style={{ width: "36px", height: "36px", borderRadius: "12px", border: "1px solid var(--border-hairline)" }} alt="" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.user.name}</span>
                      {sub.user.has_golden_ship_badge && <GoldenShipBadge show={true} size={14} />}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>@{sub.user.username}</div>
                  </div>
                  <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", padding: "4px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: 800 }}>
                    {sub.final_score.toFixed(1)}
                  </div>
                </div>

                <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: "8px", lineHeight: 1.4 }}>{sub.title}</h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "24px", lineHeight: 1.6, flex: 1 }}>
                  {sub.description}
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {sub.github_url && (
                        <a href={sub.github_url} target="_blank" rel="noreferrer" style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)" }}>
                            <GithubLogo size={18} />
                        </a>
                    )}
                    {sub.demo_url && (
                        <a href={sub.demo_url} target="_blank" rel="noreferrer" style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)" }}>
                            <Globe size={18} />
                        </a>
                    )}
                  </div>
                  <button 
                    onClick={() => handleVote(sub.id)}
                    style={{ 
                      display: "flex", alignItems: "center", gap: "8px", 
                      padding: "8px 14px", borderRadius: "10px", border: "1.5px solid var(--border-hairline)",
                      background: "transparent", cursor: "pointer", fontWeight: 700, fontSize: "13px",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-hairline)"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <ArrowUp size={16} weight="bold" /> {sub.votes_count}
                  </button>
                </div>
              </motion.div>
            ))}
            
            {(Array.isArray(competition?.submissions) ? competition.submissions : []).length === 0 && (
                <div style={{ 
                    gridColumn: "1/-1", 
                    padding: "60px 20px", 
                    textAlign: "center", 
                    background: "var(--bg-card)", 
                    borderRadius: "20px", 
                    border: "1px dashed var(--border-hairline)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px"
                }}>
                    <Info size={32} color="var(--text-tertiary)" />
                    <div>
                        <p style={{ fontWeight: 700, color: "var(--text-primary)" }}>No ships yet</p>
                        <p style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>Be the first one to ship a feature this week!</p>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div>
          {/* Eligibility Card */}
          {isSignedIn && competition && (
            <div className="sidebar-widget">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  Eligibility <CheckCircle size={20} weight="fill" color={eligibility?.eligible ? "#22c55e" : "var(--text-tertiary)"} />
                </h3>
                <div className="tooltip-container">
                  <div style={{ 
                    width: "20px", height: "200px", display: "none" // placeholder for tooltip logic
                   }}></div>
                   <div style={{ 
                     background: "var(--bg-hover)", 
                     width: "18px", height: "18px", 
                     borderRadius: "50%", 
                     display: "flex", alignItems: "center", justifyContent: "center",
                     border: "1px solid var(--border-hairline)",
                     color: "var(--text-tertiary)"
                   }}>
                     <Info size={12} weight="bold" />
                   </div>
                   <div className="tooltip-box">
                      Post 3 "Update" or "Milestone" Posts this week on Codeown to unlock the final submission button. 🚢
                   </div>
                </div>
              </div>
              
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                position: "relative",
                width: "120px",
                height: "120px",
                margin: "0 auto 24px"
              }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                  <circle
                    cx="60" cy="60" r="54"
                    fill="none"
                    stroke="var(--bg-hover)"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="60" cy="60" r="54"
                    fill="none"
                    stroke="var(--text-primary)"
                    strokeWidth="8"
                    strokeDasharray="339.29"
                    initial={{ strokeDashoffset: 339.29 }}
                    animate={{ strokeDashoffset: 339.29 - (339.29 * Math.min(((eligibility?.count || 0) / 3), 1)) }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ position: "absolute", textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: 800 }}>{eligibility?.count || 0}/3</div>
                    <div style={{ fontSize: "10px", color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase" }}>Ships</div>
                </div>
              </div>

              <p style={{ fontSize: "13px", color: "var(--text-tertiary)", textAlign: "center", lineHeight: 1.5, marginBottom: "20px" }}>
                {eligibility?.eligible 
                  ? "You've shipped enough updates to submit your final feature!" 
                  : `Ship ${3 - (eligibility?.count || 0)} more updates to unlock the "Submit Ship" button.`}
              </p>

              <button 
                className="btn-primary" 
                style={{ 
                    width: "100%", 
                    background: eligibility?.eligible ? "var(--text-primary)" : "var(--bg-hover)", 
                    color: eligibility?.eligible ? "var(--bg-page)" : "var(--text-tertiary)",
                    cursor: eligibility?.eligible ? "pointer" : "not-allowed"
                }}
                disabled={!eligibility?.eligible}
                onClick={() => setIsSubmitModalOpen(true)}
              >
                <PaperPlaneTilt size={18} weight="bold" /> Submit Final Ship
              </button>
            </div>
          )}

          {/* Wall of Fame */}
          <div className="sidebar-widget">
            <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Medal size={20} weight="fill" color="#FFD700" /> Wall of Fame
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {hallOfFame.filter(win => win && win.user).map((win) => (
                <Link key={win.id} to={`/${win.user?.username}`} className="hof-item" title={win.user?.name}>
                   <img src={win.user?.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                </Link>
              ))}
              {hallOfFame.length === 0 && (
                <div style={{ gridColumn: "span 3", textAlign: "center", padding: "32px 16px", color: "var(--text-tertiary)", background: "var(--bg-hover)", borderRadius: "12px", fontSize: "13px" }}>
                  No winners yet. <br/> Your face could be here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <LaunchCompetitionModal 
        isOpen={isLaunchModalOpen} 
        onClose={() => setIsLaunchModalOpen(false)} 
        onLaunched={fetchData} 
      />
      
      {competition && (
        <SubmitProjectModal 
          isOpen={isSubmitModalOpen} 
          onClose={() => setIsSubmitModalOpen(false)} 
          onSubmitted={fetchData}
          weekId={competition.id}
        />
      )}
    </div>
  );
}
