import { useWindowSize } from "../hooks/useWindowSize";

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

      {/* Avatar column */}
      <div style={{ flexShrink: 0 }}>
        <div className="skeleton-block" style={{ width: "36px", height: "36px", borderRadius: "50%" }}>
          <div className="skeleton-shimmer" />
        </div>
      </div>

      {/* Content column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* Header row */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div className="skeleton-block" style={{ width: "120px", height: "14px" }}>
            <div className="skeleton-shimmer" />
          </div>
          <div className="skeleton-block" style={{ width: "60px", height: "14px", opacity: 0.5 }}>
            <div className="skeleton-shimmer" />
          </div>
        </div>

        {/* Text lines */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div className="skeleton-block" style={{ width: "100%", height: "11px" }}>
            <div className="skeleton-shimmer" />
          </div>
          <div className="skeleton-block" style={{ width: "95%", height: "11px" }}>
            <div className="skeleton-shimmer" />
          </div>
          <div className="skeleton-block" style={{ width: "40%", height: "11px" }}>
            <div className="skeleton-shimmer" />
          </div>
        </div>

        {/* Interaction tray simulation */}
        <div style={{
          display: "flex",
          marginTop: "12px",
          justifyContent: "space-between",
          maxWidth: "480px",
          opacity: 0.3
        }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-block" style={{ width: "22px", height: "18px", borderRadius: "4px" }}>
              <div className="skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div style={{
      backgroundColor: "var(--bg-page)",
      padding: "48px",
      border: "0.5px solid var(--border-hairline)",
      textAlign: "center",
      position: "relative",
      overflow: "hidden"
    }}>
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
      `}</style>
      <div className="skeleton-block" style={{ width: "128px", height: "128px", borderRadius: "var(--radius-sm)", margin: "0 auto 32px" }}>
        <div className="skeleton-shimmer" />
      </div>
      <div className="skeleton-block" style={{ width: "240px", height: "32px", margin: "0 auto 16px" }}>
        <div className="skeleton-shimmer" />
      </div>
      <div className="skeleton-block" style={{ width: "180px", height: "18px", margin: "0 auto", opacity: 0.6 }}>
        <div className="skeleton-shimmer" />
      </div>
    </div>
  );
}
