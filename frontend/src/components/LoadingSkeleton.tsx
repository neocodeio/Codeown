import { useWindowSize } from "../hooks/useWindowSize";

const ShimmerStyles = () => (
  <style>{`
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    .skeleton-shimmer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        var(--skeleton-shimmer),
        transparent
      );
      animation: shimmer 1.5s infinite;
    }
    .skeleton-block {
      background-color: var(--skeleton-bg);
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }
  `}</style>
);

const SkeletonLine = ({ width, height = "12px", style = {} }: { width: string | number; height?: string; style?: React.CSSProperties }) => (
  <div className="skeleton-block" style={{ width, height, ...style }}>
    <div className="skeleton-shimmer" />
  </div>
);

const SkeletonCircle = ({ size, style = {} }: { size: string; style?: React.CSSProperties }) => (
  <div className="skeleton-block" style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, ...style }}>
    <div className="skeleton-shimmer" />
  </div>
);

export function PostCardSkeleton() {
  const { width } = useWindowSize();
  const isMobile = width < 768;

  return (
    <div style={{
      padding: isMobile ? "16px 12px" : "20px 24px",
      borderBottom: "0.5px solid var(--border-hairline)",
      display: "flex",
      gap: isMobile ? "12px" : "16px",
      width: "100%",
      boxSizing: "border-box",
      backgroundColor: "transparent",
      position: "relative",
      overflow: "hidden"
    }}>
      <ShimmerStyles />
      <div style={{ flexShrink: 0 }}>
        <SkeletonCircle size="40px" />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <SkeletonLine width="120px" height="14px" />
          <SkeletonLine width="60px" height="14px" style={{ opacity: 0.5 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <SkeletonLine width="100%" height="11px" />
          <SkeletonLine width="95%" height="11px" />
          <SkeletonLine width="40%" height="11px" />
        </div>
        <div style={{ display: "flex", marginTop: "12px", justifyContent: "space-between", maxWidth: "480px", opacity: 0.3 }}>
          {[...Array(5)].map((_, i) => (
            <SkeletonLine key={i} width="22px" height="18px" style={{ borderRadius: "4px" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div style={{ padding: "16px 20px", borderBottom: "0.5px solid var(--border-hairline)", display: "flex", gap: "12px", alignItems: "center", position: "relative", overflow: "hidden" }}>
      <ShimmerStyles />
      <SkeletonCircle size="40px" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <SkeletonLine width="70%" height="14px" />
        <SkeletonLine width="40%" height="12px" style={{ opacity: 0.5 }} />
      </div>
    </div>
  );
}

export function UserCardSkeleton() {
  return (
    <div style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "center", borderBottom: "0.5px solid var(--border-hairline)", position: "relative", overflow: "hidden" }}>
      <ShimmerStyles />
      <SkeletonCircle size="48px" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <SkeletonLine width="120px" height="14px" />
        <SkeletonLine width="80px" height="12px" style={{ opacity: 0.6 }} />
      </div>
      <SkeletonLine width="70px" height="32px" style={{ borderRadius: "100px" }} />
    </div>
  );
}

export function UserHoverCardSkeleton() {
  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", position: "relative", overflow: "hidden", minWidth: "300px" }}>
      <ShimmerStyles />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <SkeletonCircle size="60px" />
        <SkeletonLine width="80px" height="32px" style={{ borderRadius: "100px" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <SkeletonLine width="60%" height="18px" />
        <SkeletonLine width="40%" height="14px" style={{ opacity: 0.6 }} />
        <div style={{ height: "4px" }} />
        <SkeletonLine width="90%" height="14px" />
        <SkeletonLine width="80%" height="14px" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", position: "relative", overflow: "hidden" }}>
      <ShimmerStyles />
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px" }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-block" style={{ height: "140px", borderRadius: "12px" }}>
              <div className="skeleton-shimmer" />
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px" }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-block" style={{ height: "140px", borderRadius: "12px" }}>
              <div className="skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--border-hairline)", display: "flex", gap: "12px", alignItems: "center", position: "relative", overflow: "hidden" }}>
      <ShimmerStyles />
      <SkeletonCircle size="46px" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <SkeletonLine width="40%" height="14px" />
          <SkeletonLine width="15%" height="10px" style={{ opacity: 0.5 }} />
        </div>
        <SkeletonLine width="70%" height="12px" style={{ opacity: 0.6 }} />
      </div>
    </div>
  );
}

export function StartupCardSkeleton() {
  return (
    <div style={{ padding: "20px", borderRadius: "var(--radius-md)", border: "0.5px solid var(--border-hairline)", display: "flex", flexDirection: "column", gap: "16px", position: "relative", overflow: "hidden", minHeight: "220px" }}>
      <ShimmerStyles />
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <div className="skeleton-block" style={{ width: "56px", height: "56px", borderRadius: "12px", flexShrink: 0 }}>
          <div className="skeleton-shimmer" />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <SkeletonLine width="60%" height="16px" />
          <SkeletonLine width="40%" height="12px" style={{ opacity: 0.6 }} />
        </div>
      </div>
      <SkeletonLine width="100%" height="40px" style={{ borderRadius: "8px", opacity: 0.2 }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto" }}>
        <SkeletonLine width="50px" height="16px" />
        <SkeletonLine width="80px" height="24px" style={{ borderRadius: "100px" }} />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  const { width } = useWindowSize();
  const isMobile = width < 768;

  return (
    <div style={{ width: "100%", position: "relative", overflow: "hidden" }}>
      <ShimmerStyles />
      {/* Banner */}
      <div style={{ width: "100%", height: isMobile ? "200px" : "280px", backgroundColor: "var(--bg-hover)" }} className="skeleton-block">
        <div className="skeleton-shimmer" />
      </div>

      {/* Profile Info Container */}
      <div style={{ padding: isMobile ? "0 16px" : "0 24px", position: "relative", marginTop: isMobile ? "-40px" : "-60px" }}>
        {/* Overlapping Avatar */}
        <div className="skeleton-block" style={{
          width: isMobile ? "80px" : "120px",
          height: isMobile ? "80px" : "120px",
          borderRadius: "var(--radius-sm)",
          border: "4px solid var(--bg-page)",
          marginBottom: "16px"
        }}>
          <div className="skeleton-shimmer" />
        </div>

        {/* Name and Actions Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
          <div style={{ flex: 1 }}>
            <SkeletonLine width={isMobile ? "160px" : "240px"} height="28px" style={{ marginBottom: "8px" }} />
            <SkeletonLine width="100px" height="16px" style={{ opacity: 0.6 }} />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <SkeletonLine width="100px" height="36px" style={{ borderRadius: "100px" }} />
            <SkeletonLine width="36px" height="36px" style={{ borderRadius: "100px" }} />
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "32px" }}>
          <SkeletonLine width="100%" height="14px" />
          <SkeletonLine width="90%" height="14px" />
          <SkeletonLine width="40%" height="14px" />
        </div>

        {/* Metadata Grid */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginBottom: "32px" }}>
          <SkeletonLine width="120px" height="16px" style={{ opacity: 0.5 }} />
          <SkeletonLine width="140px" height="16px" style={{ opacity: 0.5 }} />
          <SkeletonLine width="100px" height="16px" style={{ opacity: 0.5 }} />
        </div>

        {/* Tabs Bar */}
        <div style={{ display: "flex", borderBottom: "0.5px solid var(--border-hairline)", gap: "32px" }}>
          <SkeletonLine width="80px" height="40px" style={{ borderRadius: "0", borderBottom: "2px solid var(--text-primary)" }} />
          <SkeletonLine width="80px" height="40px" style={{ borderRadius: "0", opacity: 0.3 }} />
          <SkeletonLine width="80px" height="40px" style={{ borderRadius: "0", opacity: 0.3 }} />
        </div>
      </div>
    </div>
  );
}

export function PostDetailSkeleton() {
  return (
    <div style={{ width: "100%", position: "relative", overflow: "hidden" }}>
      <ShimmerStyles />
      <div style={{ padding: "24px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px" }}>
          <SkeletonCircle size="48px" />
          <div style={{ flex: 1 }}>
            <SkeletonLine width="140px" height="16px" />
            <SkeletonLine width="80px" height="12px" style={{ marginTop: "6px", opacity: 0.6 }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
          <SkeletonLine width="100%" height="14px" />
          <SkeletonLine width="100%" height="14px" />
          <SkeletonLine width="90%" height="14px" />
          <SkeletonLine width="40%" height="14px" />
        </div>
        <div style={{ width: "100%", height: "300px", borderRadius: "16px", backgroundColor: "var(--bg-hover)", marginBottom: "32px" }} className="skeleton-block">
          <div className="skeleton-shimmer" />
        </div>
        <div style={{ height: "1px", backgroundColor: "var(--border-hairline)", marginBottom: "24px" }} />
        <div style={{ display: "flex", gap: "24px" }}>
          <SkeletonLine width="60px" height="20px" />
          <SkeletonLine width="60px" height="20px" />
          <SkeletonLine width="60px" height="20px" />
        </div>
      </div>
      <div style={{ padding: "16px 24px", borderTop: "0.5px solid var(--border-hairline)" }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", padding: "16px 0" }}>
            <SkeletonCircle size="36px" />
            <div style={{ flex: 1 }}>
              <SkeletonLine width="100px" height="12px" />
              <div style={{ height: "8px" }} />
              <SkeletonLine width="80%" height="11px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div style={{ width: "100%", position: "relative", overflow: "hidden" }}>
      <ShimmerStyles />
      <div style={{ padding: "16px 24px 0" }}>
        <div style={{ width: "100%", height: "300px", borderRadius: "16px", backgroundColor: "var(--bg-hover)", marginBottom: "32px" }} className="skeleton-block">
          <div className="skeleton-shimmer" />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div style={{ flex: 1 }}>
            <SkeletonLine width="70%" height="32px" style={{ marginBottom: "12px" }} />
            <div style={{ display: "flex", gap: "12px" }}>
              <SkeletonCircle size="40px" />
              <div>
                <SkeletonLine width="120px" height="14px" />
                <SkeletonLine width="80px" height="12px" style={{ marginTop: "6px", opacity: 0.6 }} />
              </div>
            </div>
          </div>
          <SkeletonLine width="100px" height="40px" style={{ borderRadius: "100px" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "16px", marginBottom: "32px" }}>
          <div style={{ height: "100px", borderRadius: "20px", backgroundColor: "var(--bg-hover)" }} className="skeleton-block"><div className="skeleton-shimmer" /></div>
          <div style={{ height: "100px", borderRadius: "20px", backgroundColor: "var(--bg-hover)" }} className="skeleton-block"><div className="skeleton-shimmer" /></div>
        </div>
        <div style={{ marginBottom: "32px" }}>
          <SkeletonLine width="100%" height="14px" />
          <SkeletonLine width="100%" height="14px" />
          <SkeletonLine width="80%" height="14px" />
        </div>
      </div>
    </div>
  );
}
