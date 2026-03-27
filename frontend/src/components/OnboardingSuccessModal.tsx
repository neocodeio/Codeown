import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import { Rocket, Users, Check, X, ArrowRight, Trophy } from "phosphor-react";
import AvailabilityBadge from "../components/AvailabilityBadge";
import VerifiedBadge from "../components/VerifiedBadge";


interface RecommendedUser {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  is_pro: boolean;
  is_hirable: boolean;
  isFollowing: boolean;
}

interface OnboardingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingSuccessModal({ isOpen, onClose }: OnboardingSuccessModalProps) {
  const [step, setStep] = useState(1);
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [founderNumber, setFounderNumber] = useState<number | null>(null);
  const { user } = useClerkUser();


  const { getToken } = useClerkAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && step === 3) {
      fetchRecommended();
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchFounderRank();
    }
  }, [isOpen, user?.id]);



  const fetchFounderRank = async () => {
    if (!user?.id) return;
    try {
      const token = await getToken();
      const res = await api.get(`/users/${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data?.founder_number) {
        setFounderNumber(res.data.founder_number);
      }
    } catch (error) {
      console.error("Failed to fetch founder rank", error);
    }
  };

  const fetchRecommended = async () => {

    setLoadingUsers(true);
    try {
      const token = await getToken();
      const res = await api.get("/users/recommended?limit=3", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setRecommendedUsers(res.data || []);
    } catch (error) {
      console.error("Failed to fetch recommended users", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleFollow = async (userId: string, isFollowing: boolean) => {
    if (isFollowing) return;
    try {
      const token = await getToken();
      await api.post(`/follows/${userId}`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setRecommendedUsers(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: true } : u));
    } catch (error) {
      console.error("Failed to follow", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(8px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "480px",
        width: "100%",
        backgroundColor: "var(--bg-page)",
        borderRadius: "var(--radius-md)",
        border: "0.5px solid var(--border-hairline)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Close Button only if user wants to skip the journey */}
        <button 
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            color: "var(--text-tertiary)",
            cursor: "pointer",
            zIndex: 10
          }}
        >
          <X size={20} />
        </button>

        {/* Step Content */}
        <div style={{ padding: "48px 32px 32px" }}>
          {step === 1 && (
            <div style={{ textAlign: "center", animation: "modalIn 0.4s ease-out" }}>
              <div style={{ 
                width: "80px", 
                height: "80px", 
                backgroundColor: "var(--bg-hover)", 
                borderRadius: "100%", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                margin: "0 auto 24px",
                color: "var(--text-primary)"
              }}>
                <Trophy size={40} weight="fill" />
              </div>
              <h2 style={{ 
                fontSize: "24px", 
                fontWeight: 700, 
                color: "var(--text-primary)", 
                letterSpacing: "-0.02em",
                marginBottom: "16px" 
              }}>
                Welcome, founder #{founderNumber || "..."}! 🏆
              </h2>


              <p style={{ 
                fontSize: "15px", 
                lineHeight: 1.6, 
                color: "var(--text-secondary)",
                marginBottom: "32px"
              }}>
                You are now part of the elite. You have been selected to be one of the first 100 programmers building the future at Codeown.
              </p>
              <button 
                onClick={() => setStep(2)}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--text-primary)",
                  color: "var(--bg-page)",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Continue <ArrowRight size={18} weight="bold" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ textAlign: "center", animation: "modalIn 0.4s ease-out" }}>
              <div style={{ 
                width: "80px", 
                height: "80px", 
                backgroundColor: "var(--bg-hover)", 
                borderRadius: "100%", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                margin: "0 auto 24px",
                color: "var(--text-primary)"
              }}>
                <Rocket size={40} weight="fill" />
              </div>
              <h2 style={{ 
                fontSize: "24px", 
                fontWeight: 700, 
                color: "var(--text-primary)", 
                letterSpacing: "-0.02em",
                marginBottom: "16px" 
              }}>
                What are you shipping today? 🚢
              </h2>
              <p style={{ 
                fontSize: "15px", 
                lineHeight: 1.6, 
                color: "var(--text-secondary)",
                marginBottom: "32px"
              }}>
                The community is waiting to see your creativity. Add your first project for everyone to see.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button 
                  onClick={() => { onClose(); navigate("/profile?action=new-project"); }}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--text-primary)",
                    color: "var(--bg-page)",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  Add My First Project
                </button>

                <button 
                  onClick={() => setStep(3)}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "transparent",
                    color: "var(--text-tertiary)",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center", animation: "modalIn 0.4s ease-out" }}>
              <div style={{ 
                width: "80px", 
                height: "80px", 
                backgroundColor: "var(--bg-hover)", 
                borderRadius: "100%", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                margin: "0 auto 24px",
                color: "var(--text-primary)"
              }}>
                <Users size={40} weight="fill" />
              </div>
              <h2 style={{ 
                fontSize: "24px", 
                fontWeight: 700, 
                color: "var(--text-primary)", 
                letterSpacing: "-0.02em",
                marginBottom: "16px" 
              }}>
                Follow the leaders 🤝
              </h2>
              <p style={{ 
                fontSize: "15px", 
                lineHeight: 1.6, 
                color: "var(--text-secondary)",
                marginBottom: "24px"
              }}>
                Follow these developers to see their updates in your feed.
              </p>
              
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "12px", 
                marginBottom: "32px",
                textAlign: "left"
              }}>
                {loadingUsers ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} style={{ height: "64px", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-sm)", animation: "pulse 1.5s infinite" }} />
                  ))
                ) : (
                  recommendedUsers.map(u => (
                    <div 
                      key={u.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px",
                        borderRadius: "var(--radius-sm)",
                        border: "0.5px solid var(--border-hairline)",
                      }}
                    >
                      <AvailabilityBadge 
                        avatarUrl={u.avatar_url} 
                        name={u.name} 
                        size={40} 
                        isOpenToOpportunities={u.is_pro && u.is_hirable} 
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{u.name.split(" ")[0]}</span>
                          <VerifiedBadge username={u.username} isPro={u.is_pro} size="14px" />
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>@{u.username}</span>
                      </div>
                      <button 
                        onClick={() => handleFollow(u.id, u.isFollowing)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: u.isFollowing ? "transparent" : "var(--text-primary)",
                          color: u.isFollowing ? "var(--text-primary)" : "var(--bg-page)",
                          border: u.isFollowing ? "1px solid var(--border-hairline)" : "none",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        {u.isFollowing ? <Check weight="bold" /> : "Follow"}
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button 
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--text-primary)",
                  color: "var(--bg-page)",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Take me to the Feed
              </button>
            </div>
          )}
        </div>

        {/* Modal Animation Style */}
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}</style>
      </div>
    </div>
  );
}
