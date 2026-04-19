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
        rgba(255, 255, 255, 0.05),
        transparent
      );
      animation: shimmer 1.5s infinite;
    }
    .skeleton-block {
      background-color: var(--bg-hover);
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }
    [data-theme='light'] .skeleton-shimmer {
      background: linear-gradient(
        90deg,
        transparent,
        rgba(0, 0, 0, 0.03),
        transparent
      );
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
  return (
    <div style={{ padding: "48px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <ShimmerStyles />
      <SkeletonCircle size="128px" style={{ margin: "0 auto 24px", borderRadius: "var(--radius-sm)" }} />
      <SkeletonLine width="200px" height="32px" style={{ margin: "0 auto 16px" }} />
      <SkeletonLine width="140px" height="18px" style={{ margin: "0 auto", opacity: 0.6 }} />
      <div style={{ marginTop: "40px", display: "flex", justifyContent: "center", gap: "48px" }}>
        <SkeletonLine width="60px" height="24px" />
        <SkeletonLine width="60px" height="24px" />
        <SkeletonLine width="60px" height="24px" />
      </div>
    </div>
  );
}
