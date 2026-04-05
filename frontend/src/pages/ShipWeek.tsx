import { useState, useEffect } from "react";
import { SEO } from "../components/SEO";
import { useWindowSize } from "../hooks/useWindowSize";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import api from "../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lightning, 
  CaretUp, 
  GithubLogo, 
  Globe, 
  Trophy,
  ArrowRight,
  Target,
  Plus
} from "phosphor-react";
import GoldenShipBadge from "../components/GoldenShipBadge";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";
import { differenceInSeconds } from "date-fns";

interface ShipSubmission {
  id: string;
  title: string;
  description: string;
  demo_url?: string;
  github_url?: string;
  votes_count: number;
  founder_score: number;
  final_score: number;
  user: {
    id: string;
    name: string;
    avatar_url: string;
    username: string;
    is_pro: boolean;
    is_og: boolean;
    has_golden_ship_badge: boolean;
  };
}

interface ShipWeek {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  theme?: string;
  description?: string;
}

export default function ShipWeek() {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;
  const { getToken } = useClerkAuth();
  const { isSignedIn, user } = useClerkUser();
  const isAdmin = user?.username === 'amin.ceo';

  const [activeTab, setActiveTab] = useState<"current" | "hall-of-fame">("current");
  const [week, setWeek] = useState<ShipWeek | null>(null);
  const [submissions, setSubmissions] = useState<ShipSubmission[]>([]);
  const [hallOfFame, setHallOfFame] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState({ count: 0, eligible: false });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Admin form state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    theme: "",
    description: "",
    end_date: ""
  });

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    demo_url: "",
    github_url: ""
  });

  const fetchData = async () => {
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [statusRes, hofRes] = await Promise.all([
        api.get("/ship-week/status", { headers }),
        api.get("/ship-week/hall-of-fame")
      ]);

      setWeek(statusRes.data.week);
      setSubmissions(Array.isArray(statusRes.data.submissions) ? statusRes.data.submissions : []);
      setUserProgress(statusRes.data.userProgress || { count: 0, eligible: false });
      setHallOfFame(Array.isArray(hofRes.data) ? hofRes.data : []);
    } catch (err) {
      console.error("Failed to fetch ship week data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (!week) return;
    const interval = setInterval(() => {
      const seconds = differenceInSeconds(new Date(week.end_date), new Date());
      if (seconds <= 0) {
        setTimeLeft("Week Ended");
        return;
      }
      const d = Math.floor(seconds / (3600 * 24));
      const h = Math.floor((seconds % (3600 * 24)) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [week]);

  const handleVote = async (submissionId: string) => {
    if (!isSignedIn) return alert("Sign in to vote!");
    try {
      const token = await getToken();
      await api.post(`/ship-week/vote/${submissionId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to vote");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!week) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      await api.post("/ship-week/submit", {
        ...formData,
        week_id: week.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to submit project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = await getToken();
      await api.post("/ship-week/admin/create-week", adminFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAdminModalOpen(false);
      setAdminFormData({ theme: "", description: "", end_date: "" });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create new cycle");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ 
      backgroundColor: "var(--bg-page)", 
      minHeight: "100vh", 
      padding: 0,
      fontFamily: "var(--font-main)",
      position: "relative",
      overflowX: "hidden"
    }}>
      <SEO title="The Ship Week | Codeown" description="High-stakes weekly building competition." />

      <div style={{
        display: "flex",
        justifyContent: (isDesktop && !isMobile) ? "flex-start" : "center",
        width: isDesktop ? "1020px" : "100%",
        maxWidth: "1020px",
        margin: (isDesktop && !isMobile) ? "0" : "0 auto",
        position: "relative"
      }}>
        {/* Main Content */}
        <div style={{
          width: isDesktop ? "var(--feed-width)" : "100%",
          maxWidth: isDesktop ? "var(--feed-width)" : "720px",
          borderRight: (isDesktop && !isMobile) ? "0.5px solid var(--border-hairline)" : "none",
          minHeight: "100vh",
          padding: isMobile ? "24px 16px 120px" : "60px 32px 120px",
          backgroundColor: "var(--bg-page)",
        }}>
          {/* Bespoke Header */}
          <header style={{ marginBottom: "64px" }}>
            {/* <motion.div 
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}
            >
              <div style={{ 
                width: "32px", height: "32px", 
                backgroundColor: "var(--text-primary)", 
                borderRadius: "8px", 
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--bg-page)"
              }}>
                <Lightning size={18} weight="fill" />
              </div>
              <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
                Competition / Cycle 04
              </span>
            </motion.div> */}

            <h1 style={{ 
              fontSize: isMobile ? "40px" : "64px", 
              fontWeight: "900", 
              letterSpacing: "-0.05em", 
              lineHeight: "0.9", 
              color: "var(--text-primary)",
              marginBottom: "24px"
            }}>
              The <span style={{ 
                background: "linear-gradient(135deg, var(--text-primary) 30%, var(--text-tertiary) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>Ship Week</span>
              {isAdmin && (
                <button 
                  onClick={() => setIsAdminModalOpen(true)}
                  style={{ 
                    marginLeft: "24px", 
                    width: "44px", height: "44px",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: "var(--bg-hover)", border: "0.5px solid var(--border-hairline)",
                    borderRadius: "50%", cursor: "pointer", 
                    verticalAlign: "middle",
                    transition: "all 0.2s var(--ease-smooth)"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--text-primary)"}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--border-hairline)"}
                >
                  <Plus size={20} weight="bold" />
                </button>
              )}
            </h1>

            <p style={{ fontSize: "18px", color: "var(--text-secondary)", fontWeight: "400", maxWidth: "480px", lineHeight: "1.5", letterSpacing: "-0.01em" }}>
              {week?.theme || "Prove your speed. Ship a major feature in 7 days. Earn the Golden Ship."}
            </p>
            {week?.description && (
              <p style={{ fontSize: "14px", color: "var(--text-tertiary)", marginTop: "12px", maxWidth: "480px" }}>
                {week.description}
              </p>
            )}

            <div style={{ display: "flex", gap: "24px", marginTop: "40px", borderBottom: "0.5px solid var(--border-hairline)" }}>
              <button 
                onClick={() => setActiveTab("current")}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: "12px 0",
                  fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em",
                  color: activeTab === "current" ? "var(--text-primary)" : "var(--text-tertiary)",
                  position: "relative", transition: "color 0.2s"
                }}
              >
                Weekly Dash
                {activeTab === "current" && <motion.div layoutId="tab" style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: "2px", backgroundColor: "var(--text-primary)" }} />}
              </button>
              <button 
                onClick={() => setActiveTab("hall-of-fame")}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: "12px 0",
                  fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em",
                  color: activeTab === "hall-of-fame" ? "var(--text-primary)" : "var(--text-tertiary)",
                  position: "relative", transition: "color 0.2s"
                }}
              >
                Wall of Fame
                {activeTab === "hall-of-fame" && <motion.div layoutId="tab" style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: "2px", backgroundColor: "var(--text-primary)" }} />}
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === "current" ? (
              <motion.div
                key="current"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {/* Stats Row */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", 
                  gap: "12px", 
                  marginBottom: "48px" 
                }}>
                  <div style={{ backgroundColor: "var(--bg-card)", border: "0.5px solid var(--border-hairline)", borderRadius: "24px", padding: "28px", position: "relative", overflow: "hidden" }}>
                    <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-tertiary)", marginBottom: "12px", letterSpacing: "0.1em" }}>T-MINUS RESET</div>
                    <div style={{ fontSize: "32px", fontWeight: "900", color: "var(--text-primary)", fontFamily: "var(--font-mono)", letterSpacing: "-0.05em" }}>{timeLeft || "LOADING..." }</div>
                    <Lightning size={80} style={{ position: "absolute", right: "-10px", bottom: "-10px", opacity: 0.03, color: "var(--text-primary)" }} weight="fill" />
                  </div>
                  
                  <div style={{ backgroundColor: "var(--bg-card)", border: "0.5px solid var(--border-hairline)", borderRadius: "24px", padding: "28px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-tertiary)", marginBottom: "12px", letterSpacing: "0.1em" }}>YOUR STATUS</div>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyItems: "center", gap: "8px" }}>
                       <div style={{ fontSize: "32px", fontWeight: "900", color: userProgress?.eligible ? "#22c55e" : "var(--text-primary)" }}>{userProgress?.count || 0}/3</div>
                       <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-tertiary)", marginBottom: "8px" }}>SHIPS</div>
                    </div>
                    {/* Progress Dots */}
                    <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
                       {[1, 2, 3].map(i => (
                         <div key={i} style={{ flex: 1, height: "4px", backgroundColor: (userProgress?.count || 0) >= i ? (userProgress.eligible ? "#22c55e" : "var(--text-primary)") : "var(--border-hairline)", borderRadius: "2px" }} />
                       ))}
                    </div>
                  </div>
                </div>

                {/* Submit Trigger - Premium CTA */}
                {userProgress?.eligible && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setIsModalOpen(true)}
                    style={{
                      width: "100%", padding: "24px", backgroundColor: "var(--text-primary)", color: "var(--bg-page)",
                      border: "none", borderRadius: "24px", fontWeight: "900", fontSize: "16px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "64px",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                    }}
                  >
                    <span>Ready to claim your spot?</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      Submit Final Ship <ArrowRight size={20} weight="bold" />
                    </div>
                  </motion.button>
                )}

                {/* Submissions Feed */}
                <section>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-primary)" }}>Weekly Feed</h3>
                    <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: "600" }}>{submissions.length} CONTENDERS</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {submissions.length === 0 ? (
                      <div style={{ padding: "60px", textAlign: "center", border: "0.5px dashed var(--border-hairline)", borderRadius: "24px" }}>
                        <Target size={32} style={{ color: "var(--text-tertiary)", marginBottom: "16px", opacity: 0.5 }} />
                        <p style={{ fontSize: "14px", color: "var(--text-tertiary)", fontWeight: "500" }}>The feed is quiet. Be the first to disrupt it.</p>
                      </div>
                    ) : (
                      submissions.map((sub, i) => (
                        <motion.div 
                          key={sub.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          style={{ 
                            backgroundColor: "var(--bg-card)", 
                            border: "0.5px solid var(--border-hairline)", 
                            borderRadius: "24px", 
                            padding: "24px",
                            display: "flex", gap: "20px",
                            transition: "all 0.3s var(--ease-smooth)",
                            cursor: "default"
                          }}
                        >
                          <div style={{ position: "relative" }}>
                            <img src={sub.user.avatar_url || "/default-avatar.png"} style={{ width: "48px", height: "48px", borderRadius: "14px", objectFit: "cover" }} alt="" />
                            {sub.user.has_golden_ship_badge && (
                              <div style={{ position: "absolute", bottom: -6, right: -6 }}>
                                <GoldenShipBadge size={14} />
                              </div>
                            )}
                          </div>
                          
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                              <span style={{ fontSize: "13px", fontWeight: "800", color: "var(--text-primary)" }}>{sub.user.name}</span>
                              <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: "500" }}>@{sub.user.username}</span>
                            </div>
                            
                            <h4 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "8px", letterSpacing: "-0.01em" }}>{sub.title}</h4>
                            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "20px" }}>{sub.description}</p>
                            
                            <div style={{ display: "flex", gap: "12px" }}>
                              {sub.demo_url && <a href={sub.demo_url} target="_blank" style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "4px" }}><Globe size={14} /> Demo</a>}
                              {sub.github_url && <a href={sub.github_url} target="_blank" style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "4px" }}><GithubLogo size={14} /> Source</a>}
                            </div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleVote(sub.id)}
                              style={{ 
                                background: "var(--bg-hover)", 
                                border: "0.5px solid var(--border-hairline)", 
                                width: "44px", height: "44px", 
                                borderRadius: "14px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "var(--text-primary)",
                                cursor: "pointer"
                              }}
                            >
                              <CaretUp size={24} weight="bold" />
                            </motion.button>
                            <span style={{ fontSize: "14px", fontWeight: "900", color: "var(--text-primary)" }}>{sub.votes_count}</span>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </section>
              </motion.div>
            ) : (
              <motion.div
                key="hall-of-fame"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", 
                  gap: "12px" 
                }}
              >
                {hallOfFame.length === 0 ? (
                  <div style={{ gridColumn: "1 / -1", padding: "100px", textAlign: "center", color: "var(--text-tertiary)" }}>
                     <Trophy size={48} weight="duotone" style={{ marginBottom: "20px", opacity: 0.2 }} />
                     <p style={{ fontWeight: "700" }}>The wall is waiting for its first legend.</p>
                  </div>
                ) : (
                  hallOfFame.map((entry, i) => (
                    <motion.div 
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      style={{
                        padding: "40px 32px",
                        borderRadius: "32px",
                        border: "0.5px solid var(--border-hairline)",
                        backgroundColor: "var(--bg-card)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        position: "relative",
                        overflow: "hidden"
                      }}
                    >
                      {/* Gilded Accent */}
                      <div style={{ 
                        position: "absolute", top: 0, left: 0, right: 0, height: "4px", 
                        background: "linear-gradient(90deg, #FFD700 0%, transparent 100%)",
                        opacity: 0.3
                      }} />

                      <div style={{ position: "absolute", top: "24px", right: "24px", color: "#FFD700" }}>
                        <Trophy size={28} weight="fill" />
                      </div>

                      <div style={{ marginBottom: "24px", position: "relative" }}>
                        <img 
                          src={entry.user.avatar_url || "/default-avatar.png"} 
                          style={{ 
                            width: "96px", height: "96px", 
                            borderRadius: "28px", 
                            border: "3px solid #FFD700",
                            boxShadow: "0 20px 40px rgba(255, 215, 0, 0.15)",
                            objectFit: "cover"
                          }} 
                          alt="" 
                        />
                        <div style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)" }}>
                          <GoldenShipBadge size={24} />
                        </div>
                      </div>

                      <h5 style={{ fontWeight: "900", color: "var(--text-primary)", fontSize: "20px", marginBottom: "4px", letterSpacing: "-0.03em" }}>{entry.user.name}</h5>
                      <p style={{ fontSize: "13px", color: "var(--text-tertiary)", fontWeight: "600", marginBottom: "24px" }}>@{entry.user.username}</p>
                      
                      <div style={{ 
                        backgroundColor: "var(--bg-hover)", 
                        padding: "16px 20px", 
                        borderRadius: "18px", 
                        width: "100%",
                        border: "0.5px solid var(--border-hairline)" 
                      }}>
                        <div style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>winning submission</div>
                        <div style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-primary)" }}>{entry.project.title}</div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Sidebar */}
        {isDesktop && (
          <aside style={{ 
            width: "340px", 
            position: "sticky", 
            top: 0, 
            alignSelf: "flex-start", 
            padding: "0 20px 0 0", // Only right padding
            height: "100vh",
            display: "flex",
            flexDirection: "column"
          }}>
             <RecommendedUsersSidebar />
          </aside>
        )}
      </div>

      {/* Modern Submission Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: "fixed", inset: 0, 
              backgroundColor: "rgba(0,0,0,0.9)", 
              backdropFilter: "blur(10px)",
              zIndex: 1000, 
              display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" 
            }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              style={{ 
                backgroundColor: "var(--bg-page)", 
                border: "0.5px solid var(--border-hairline)", 
                borderRadius: "32px", 
                width: "100%", maxWidth: "540px", 
                padding: "48px",
                boxShadow: "0 40px 100px rgba(0,0,0,0.5)"
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ fontSize: "32px", fontWeight: "900", color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.04em" }}>Final Ship.</h2>
              <p style={{ fontSize: "16px", color: "var(--text-secondary)", marginBottom: "32px", lineHeight: "1.5" }}>
                You've completed the required persistence. Now, showcase your masterpiece.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-tertiary)", marginBottom: "8px", letterSpacing: "0.1em" }}>FEATURE TITLE</label>
                  <input 
                    required 
                    placeholder="e.g. Real-time Collaboration Engine"
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    style={{ 
                      width: "100%", padding: "16px", borderRadius: "14px", 
                      backgroundColor: "var(--bg-hover)", border: "0.5px solid var(--border-hairline)", 
                      color: "var(--text-primary)", fontWeight: "600"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-tertiary)", marginBottom: "8px", letterSpacing: "0.1em" }}>THE PITCH</label>
                  <textarea 
                    required 
                    placeholder="Why does this matter? What did you ship?"
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    style={{ 
                      width: "100%", padding: "16px", borderRadius: "14px", 
                      backgroundColor: "var(--bg-hover)", border: "0.5px solid var(--border-hairline)", 
                      color: "var(--text-primary)", fontWeight: "500", lineHeight: "1.5"
                    }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-tertiary)", marginBottom: "8px", letterSpacing: "0.1em" }}>DEMO URL</label>
                    <input 
                      placeholder="https://..."
                      value={formData.demo_url} 
                      onChange={e => setFormData({...formData, demo_url: e.target.value})}
                      style={{ width: "100%", padding: "16px", borderRadius: "14px", backgroundColor: "var(--bg-hover)", border: "0.5px solid var(--border-hairline)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-tertiary)", marginBottom: "8px", letterSpacing: "0.1em" }}>GITHUB</label>
                    <input 
                      placeholder="repo link"
                      value={formData.github_url} 
                      onChange={e => setFormData({...formData, github_url: e.target.value})}
                      style={{ width: "100%", padding: "16px", borderRadius: "14px", backgroundColor: "var(--bg-hover)", border: "0.5px solid var(--border-hairline)", color: "var(--text-primary)" }}
                    />
                  </div>
                </div>

                <button 
                  disabled={submitting}
                  style={{ 
                    marginTop: "16px", padding: "20px", 
                    backgroundColor: "var(--text-primary)", color: "var(--bg-page)", 
                    border: "none", borderRadius: "16px", fontWeight: "900", 
                    cursor: "pointer", opacity: submitting ? 0.5 : 1,
                    fontSize: "15px"
                  }}
                >
                  {submitting ? "SHIPPING Masterpiece..." : "COMMIT SUBMISSION"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Admin Creation Modal */}
        {isAdminModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: "fixed", inset: 0, 
              backgroundColor: "rgba(0,0,0,0.9)", 
              backdropFilter: "blur(10px)",
              zIndex: 1100, 
              display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" 
            }}
            onClick={() => setIsAdminModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              style={{ 
                backgroundColor: "var(--bg-page)", 
                border: "0.5px solid var(--border-hairline)", 
                borderRadius: "32px", 
                width: "100%", maxWidth: "500px", 
                padding: "48px",
                boxShadow: "0 40px 100px rgba(0,0,0,0.5)"
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ fontSize: "28px", fontWeight: "900", color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.04em" }}>New Challenge Cycle.</h2>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "32px" }}>Define the theme for the upcoming week.</p>

              <form onSubmit={handleAdminSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-tertiary)", marginBottom: "8px", letterSpacing: "0.1em" }}>CHALLENGE NAME / THEME</label>
                  <input 
                    required 
                    placeholder="e.g. AI-First Productivity Tools"
                    value={adminFormData.theme} 
                    onChange={e => setAdminFormData({...adminFormData, theme: e.target.value})}
                    style={{ width: "100%", padding: "16px", borderRadius: "14px", backgroundColor: "var(--bg-hover)", border: "0.5px solid var(--border-hairline)", color: "var(--text-primary)", fontWeight: "600" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-tertiary)", marginBottom: "8px", letterSpacing: "0.1em" }}>MISSION DESCRIPTION</label>
                  <textarea 
                    required 
                    placeholder="Briefly explain the goal..."
                    value={adminFormData.description} 
                    onChange={e => setAdminFormData({...adminFormData, description: e.target.value})}
                    rows={3}
                    style={{ width: "100%", padding: "16px", borderRadius: "14px", backgroundColor: "var(--bg-hover)", border: "0.5px solid var(--border-hairline)", color: "var(--text-primary)", fontWeight: "500" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-tertiary)", marginBottom: "8px", letterSpacing: "0.1em" }}>DEADLINE (E.G. NEXT SUNDAY)</label>
                  <input 
                    required 
                    type="datetime-local"
                    value={adminFormData.end_date} 
                    onChange={e => setAdminFormData({...adminFormData, end_date: e.target.value})}
                    style={{ width: "100%", padding: "16px", borderRadius: "14px", backgroundColor: "var(--bg-hover)", border: "0.5px solid var(--border-hairline)", color: "var(--text-primary)" }}
                  />
                </div>

                <button 
                  disabled={submitting}
                  style={{ 
                    marginTop: "12px", padding: "18px", 
                    backgroundColor: "var(--text-primary)", color: "var(--bg-page)", 
                    border: "none", borderRadius: "16px", fontWeight: "900", 
                    cursor: "pointer", opacity: submitting ? 0.5 : 1
                  }}
                >
                  {submitting ? "INITIALIZING..." : "LAUNCH COMPETITION"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
