import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import { 
  Medal, 
  Plus, 
  PaperPlaneTilt, 
  ArrowUp,
  GithubLogo,
  Globe,
  Info,
  Calendar,
  UsersThree,
  Timer
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
  const isTablet = width < 1280;

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
      maxWidth: "1400px", 
      margin: "0 auto", 
      padding: isMobile ? "20px 16px" : "40px 32px",
      minHeight: "100vh"
    }}>
      <style>{`
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 48px;
            flex-wrap: wrap;
            gap: 24px;
        }

        .header-title {
            font-size: ${isMobile ? "32px" : "48px"};
            font-weight: 950;
            letter-spacing: -0.06em;
            margin: 0;
            line-height: 1;
            color: var(--text-primary);
        }

        .header-subtitle {
            font-size: 16px;
            color: var(--text-secondary);
            font-weight: 500;
            max-width: 500px;
            margin-top: 12px;
            line-height: 1.5;
        }

        .main-layout {
            display: grid;
            grid-template-columns: ${isTablet ? "1fr" : "auto 360px"};
            gap: 48px;
            align-items: start;
        }

        .ship-grid {
            display: grid;
            grid-template-columns: ${width < 768 ? "1fr" : "repeat(auto-fill, minmax(400px, 1fr))"};
            gap: 24px;
        }

        .ship-card {
            background: var(--bg-card);
            border: 1px solid var(--border-hairline);
            border-radius: 20px;
            padding: 32px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
        }

        .ship-card:hover {
            border-color: var(--text-primary);
            box-shadow: 0 20px 40px -12px rgba(0,0,0,0.08);
            transform: translateY(-2px);
        }

        .ship-card-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
        }

        .user-avatar {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            object-fit: cover;
            border: 1px solid var(--border-hairline);
        }

        .ship-title {
            font-size: 20px;
            font-weight: 850;
            letter-spacing: -0.03em;
            margin: 0 0 8px 0;
            color: var(--text-primary);
        }

        .ship-desc {
            font-size: 15px;
            color: var(--text-secondary);
            line-height: 1.6;
            margin-bottom: 32px;
            flex-grow: 1;
        }

        .voter-btn {
            background: var(--bg-hover);
            border: 1px solid var(--border-hairline);
            padding: 10px 18px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 800;
            color: var(--text-primary);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .voter-btn:hover {
            background: var(--text-primary);
            color: var(--bg-page);
            border-color: var(--text-primary);
        }

        .sidebar-panel {
            background: var(--bg-card);
            border: 1px solid var(--border-hairline);
            border-radius: 24px;
            padding: 32px;
            position: sticky;
            top: 100px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .panel-title {
            font-size: 18px;
            font-weight: 850;
            letter-spacing: -0.03em;
            margin: 0 0 24px 0;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .progress-ring-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px 0;
            border-bottom: 1px solid var(--border-hairline);
            margin-bottom: 32px;
        }

        .action-button {
            width: 100%;
            padding: 16px;
            border-radius: 14px;
            font-weight: 800;
            font-size: 15px;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }

        .action-button.primary {
            background: var(--text-primary);
            color: var(--bg-page);
        }

        .action-button.primary:hover:not(:disabled) {
            filter: brightness(1.2);
            transform: translateY(-1px);
        }

        .action-button.secondary {
            background: transparent;
            color: var(--text-primary);
            border: 1px solid var(--border-hairline);
        }

        .action-button.secondary:hover {
            background: var(--bg-hover);
        }

        .tooltip-container {
          position: relative;
          cursor: pointer;
        }

        .tooltip-box {
          position: absolute;
          bottom: 100%;
          right: 0;
          width: 240px;
          background: #000;
          color: #fff;
          padding: 14px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(10px) scale(0.95);
          z-index: 50;
          margin-bottom: 12px;
          pointer-events: none;
          line-height: 1.5;
        }

        .tooltip-container:hover .tooltip-box {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
        }

        .hof-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
        }

        .hof-avatar {
            width: 100%;
            aspect-ratio: 1;
            border-radius: 12px;
            object-fit: cover;
            border: 2px solid var(--border-hairline);
            transition: all 0.2s ease;
        }

        .hof-avatar:hover {
            border-color: #FFD700;
            transform: scale(1.1);
        }

        .badge-pill {
            background: var(--bg-hover);
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 8px;
            border: 1px solid var(--border-hairline);
            color: var(--text-secondary);
        }

        .pulse-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #22c55e;
            box-shadow: 0 0 10px #22c55e;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.8; }
        }
      `}</style>

      {/* Header Area */}
      <div className="page-header">
        <div>
           <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
              <span className="badge-pill">
                  <div className="pulse-dot" /> LIVE Season 1
              </span>
              <span className="badge-pill"><Calendar size={18} /> Daily Ships</span>
              <span className="badge-pill" style={{ color: "#FFD700", background: "rgba(255, 215, 0, 0.05)", borderColor: "rgba(255, 215, 0, 0.2)" }}>
                  <Medal size={18} weight="fill" /> Golden Tier
              </span>
           </div>
           <h1 className="header-title">{competition?.name || "The Ship Week"}</h1>
           <p className="header-subtitle">
               {competition?.description || "A high-stakes weekly sprint. Build one major project, ship three daily updates, and win the legendary Golden Ship Badge."}
           </p>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
            {isAdmin && <button className="action-button secondary" onClick={() => setIsLaunchModalOpen(true)}><Plus size={20} weight="bold" /> Launch New Season</button>}
            {!isSignedIn ? (
                <button className="action-button primary" onClick={() => navigate("/sign-in")}>Join the Fight</button>
            ) : (
                !eligibility?.isJoined && (
                    <button 
                        className="action-button primary" 
                        onClick={handleJoin} 
                        disabled={isJoining}
                        style={{ width: "200px" }}
                    >
                        {isJoining ? "Joining..." : "Enter Competition"}
                    </button>
                )
            )}
        </div>
      </div>

      <div className="main-layout">
        {/* Main Feed */}
        <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", borderBottom: "1.5px solid var(--border-hairline)", paddingBottom: "16px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                   <PaperPlaneTilt size={24} weight="bold" /> ACTIVE DOCK <span style={{ color: "var(--text-tertiary)", fontSize: "14px", fontWeight: 600 }}>({(Array.isArray(competition?.submissions) ? competition.submissions : []).length} SHIPS)</span>
                </h2>
                <div style={{ display: "flex", gap: "8px", fontSize: "13px", fontWeight: 800, color: "var(--text-tertiary)" }}>
                    <Timer size={18} /> {competition ? safeFormatDistance(competition.end_date) : "SOON"}
                </div>
            </div>

            <div className="ship-grid">
                {(Array.isArray(competition?.submissions) ? competition.submissions : []).filter((s: any) => s && s.user).map((sub: any) => (
                    <motion.div 
                        key={sub.id} 
                        className="ship-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="ship-card-header">
                            <img src={sub.user?.avatar_url || ''} className="user-avatar" alt="" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                   <div style={{ fontWeight: 900, fontSize: "15px", color: "var(--text-primary)" }}>{sub.user.name}</div>
                                   {sub.user.has_golden_ship_badge && <GoldenShipBadge show={true} size={15} />}
                                </div>
                                <div style={{ fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 600 }}>@{sub.user.username}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "24px", fontWeight: 950, color: "var(--text-primary)", lineHeight: 1 }}>{sub.final_score.toFixed(1)}</div>
                                <div style={{ fontSize: "10px", color: "var(--text-tertiary)", fontWeight: 800, textTransform: "uppercase" }}>Rank Score</div>
                            </div>
                        </div>

                        <h3 className="ship-title">{sub.title}</h3>
                        <p className="ship-desc">{sub.description}</p>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-hairline)", paddingTop: "24px" }}>
                            <div style={{ display: "flex", gap: "12px" }}>
                                {sub.github_url && <a href={sub.github_url} target="_blank" rel="noreferrer" className="voter-btn" style={{ padding: "10px" }}><GithubLogo size={20} /></a>}
                                {sub.demo_url && <a href={sub.demo_url} target="_blank" rel="noreferrer" className="voter-btn" style={{ padding: "10px" }}><Globe size={20} /></a>}
                            </div>
                            <button className="voter-btn" onClick={() => handleVote(sub.id)}>
                                <ArrowUp size={18} weight="bold" /> {sub.votes_count} VOTES
                            </button>
                        </div>
                    </motion.div>
                ))}

                {(Array.isArray(competition?.submissions) ? competition.submissions : []).length === 0 && (
                     <div style={{ 
                        gridColumn: "1/-1", 
                        padding: "100px 32px", 
                        textAlign: "center", 
                        background: "var(--bg-card)", 
                        borderRadius: "24px", 
                        border: "1.5px dashed var(--border-hairline)",
                        color: "var(--text-tertiary)"
                    }}>
                        <Rocket size={48} style={{ marginBottom: "20px", opacity: 0.5 }} />
                        <h3 style={{ fontSize: "20px", fontWeight: 850, color: "var(--text-primary)", marginBottom: "8px" }}>The dock is empty.</h3>
                        <p>Be the first developer to anchor your ship for Season 1.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar-panel">
            {/* Eligibility Ring */}
            <div className="panel-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>MISSION ELIGIBILITY</span>
                <div className="tooltip-container">
                    <Info size={18} weight="bold" color="var(--text-tertiary)" />
                    <div className="tooltip-box">
                       Submit 3 "Update" or "Milestone" posts to prove your work and unlock the final project submission. 🚢
                    </div>
                </div>
            </div>

            {isSignedIn && competition ? (
                <>
                    <div className="progress-ring-container">
                        <div style={{ position: "relative", width: "160px", height: "160px", display: "flex", alignItems: "center", justifyItems: "center" }}>
                           <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
                               <circle
                                 cx="80" cy="80" r="70"
                                 fill="none"
                                 stroke="var(--bg-hover)"
                                 strokeWidth="10"
                               />
                               <motion.circle
                                 cx="80" cy="80" r="70"
                                 fill="none"
                                 stroke="var(--text-primary)"
                                 strokeWidth="10"
                                 strokeDasharray="439.82"
                                 initial={{ strokeDashoffset: 439.82 }}
                                 animate={{ strokeDashoffset: 439.82 - (439.82 * Math.min(((eligibility?.count || 0) / 3), 1)) }}
                                 transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                                 strokeLinecap="round"
                               />
                           </svg>
                           <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                               <div style={{ fontSize: "32px", fontWeight: 950, color: "var(--text-primary)", lineHeight: 1 }}>{eligibility?.count || 0}<span style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>/3</span></div>
                               <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", marginTop: "4px" }}>Ships Verified</div>
                           </div>
                        </div>
                    </div>

                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500, textAlign: "center", lineHeight: 1.6, marginBottom: "32px" }}>
                        {eligibility?.eligible 
                            ? "Status: READY TO DEPLOY. Your ship is cleared for the final submission dock."
                            : `Status: INCOMPLETE. You need ${3 - (eligibility?.count || 0)} more verified updates to authorize submission.`}
                    </p>

                    <button 
                        className="action-button primary" 
                        disabled={!eligibility?.eligible}
                        onClick={() => setIsSubmitModalOpen(true)}
                        style={{ background: eligibility?.eligible ? "var(--text-primary)" : "var(--bg-hover)", color: eligibility?.eligible ? "var(--bg-page)" : "var(--text-tertiary)" }}
                    >
                        {eligibility?.isJoined ? (
                            <>Submit Final Entry <PaperPlaneTilt size={20} weight="bold" /></>
                        ) : (
                            "Need to Join First"
                        )}
                    </button>
                </>
            ) : (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-tertiary)" }}>
                    <UsersThree size={32} style={{ marginBottom: "16px" }} />
                    <p style={{ fontSize: "14px", fontWeight: 600 }}>Sign in to track your eligibility and join the season.</p>
                </div>
            )}

            <div style={{ marginTop: "48px" }}>
                <div className="panel-title"><Medal size={22} weight="fill" color="#FFD700" /> HALL OF FAME</div>
                <div className="hof-grid">
                    {hallOfFame.filter(win => win && win.user).map((win) => (
                        <Link key={win.id} to={`/${win.user?.username}`} title={win.user?.name}>
                            <img src={win.user?.avatar_url} className="hof-avatar" alt="" />
                        </Link>
                    ))}
                    {hallOfFame.length === 0 && (
                        <div style={{ gridColumn: "span 4", padding: "32px 16px", textAlign: "center", background: "var(--bg-hover)", borderRadius: "16px", fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 600 }}>
                            No winners yet. <br/> Claim the first spot.
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

function Rocket({ size, style }: { size: number, style?: any }) {
    return (
        <svg viewBox="0 0 256 256" width={size} height={size} style={style}>
            <rect width="256" height="256" fill="none"/>
            <path d="M128,24S24,112,24,192a24,24,0,0,0,24,24c40,0,52-36,52-36h56s12,36,52,36a24,24,0,0,0,24-24C232,112,128,24,128,24Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/>
            <circle cx="128" cy="112" r="20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/>
        </svg>
    );
}
