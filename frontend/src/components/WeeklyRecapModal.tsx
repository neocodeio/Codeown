import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Cancel01Icon, 
  FireIcon, 
  UserGroupIcon, 
  ViewIcon, 
  FavouriteIcon,
  Rocket01Icon,
  Share01Icon
} from "@hugeicons/core-free-icons";

interface WeeklyRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    new_followers: number;
    project_views: number;
    post_views: number;
    new_likes: number;
    streak: number;
  };
}

export default function WeeklyRecapModal({ isOpen, onClose, stats }: WeeklyRecapModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.4)",
      backdropFilter: "blur(4px)",
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }} onClick={onClose}>
      <div 
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "#fff",
          borderRadius: "32px",
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          animation: "modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Decor */}
        <div style={{
          height: "120px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden"
        }}>
          {/* Decorative Circles */}
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", bottom: "-30px", left: "-10px", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
          
          <div style={{ textAlign: "center", zIndex: 1 }}>
            <h2 style={{ color: "#fff", margin: 0, fontSize: "24px", fontWeight: 900, letterSpacing: "-0.04em" }}>Weekly Recap</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: "4px 0 0 0", fontSize: "14px", fontWeight: 600 }}>You're crushing it!</p>
          </div>

          <button 
            onClick={onClose}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              cursor: "pointer",
              zIndex: 2
            }}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
            {/* Followers Card */}
            <div style={{ 
              padding: "20px", 
              backgroundColor: "#f8fafc", 
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#0369a1" }}>
                <HugeiconsIcon icon={UserGroupIcon} size={18} />
              </div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a" }}>+{stats.new_followers}</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>New Followers</div>
            </div>

            {/* Views Card */}
            <div style={{ 
              padding: "20px", 
              backgroundColor: "#f8fafc", 
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", color: "#b45309" }}>
                <HugeiconsIcon icon={ViewIcon} size={18} />
              </div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a" }}>{stats.project_views + stats.post_views}</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Views</div>
            </div>

            {/* Likes Card */}
            <div style={{ 
              padding: "20px", 
              backgroundColor: "#f8fafc", 
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#fce7f3", display: "flex", alignItems: "center", justifyContent: "center", color: "#be185d" }}>
                <HugeiconsIcon icon={FavouriteIcon} size={18} />
              </div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a" }}>{stats.new_likes}</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Likes Received</div>
            </div>

            {/* Streak Card */}
            <div style={{ 
              padding: "20px", 
              backgroundColor: "#fff7ed", 
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              border: "1px solid #ffedd5"
            }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#ffedd5", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c" }}>
                <HugeiconsIcon icon={FireIcon} size={18} />
              </div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#c2410c" }}>{stats.streak}d</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#c2410c", textTransform: "uppercase" }}>Current Streak</div>
            </div>
          </div>

          <div style={{
            padding: "20px",
            backgroundColor: "#0f172a",
            borderRadius: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            color: "#fff"
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "4px" }}>Keep the momentum!</div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>Launch a new project today to boost next week's stats.</div>
            </div>
            <HugeiconsIcon icon={Rocket01Icon} size={32} style={{ opacity: 0.8 }} />
          </div>
          
          <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
            <button 
              onClick={onClose}
              style={{
                flex: 1,
                padding: "16px",
                backgroundColor: "#f1f5f9",
                color: "#1e293b",
                border: "none",
                borderRadius: "16px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Close
            </button>
            <button 
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "16px 24px",
                backgroundColor: "#000",
                color: "#fff",
                border: "none",
                borderRadius: "16px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer"
              }}
              onClick={() => {
                // Future share logic
                alert("Stats copied to clipboard! Share your progress.");
              }}
            >
              <HugeiconsIcon icon={Share01Icon} size={18} />
              Share
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes modalSlideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
