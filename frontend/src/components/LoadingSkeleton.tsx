export function PostCardSkeleton() {
  return (
    <article
      style={{
        backgroundColor: "var(--bg-page)",
        padding: "40px",
        borderBottom: "0.5px solid var(--border-hairline)",
        display: "flex",
        gap: "20px"
      }}
    >
      {/* Left Column: Avatar skeleton */}
      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--bg-hover)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>

      {/* Right Column: Content skeleton */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <div
            style={{
              width: "120px",
              height: "16px",
              backgroundColor: "var(--bg-hover)",
              borderRadius: "var(--radius-xs)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              width: "80px",
              height: "14px",
              backgroundColor: "var(--bg-hover)",
              borderRadius: "var(--radius-xs)",
              animation: "pulse 1.5s ease-in-out infinite",
              opacity: 0.6
            }}
          />
        </div>

        <div
          style={{
            width: "80%",
            height: "18px",
            backgroundColor: "var(--bg-hover)",
            borderRadius: "var(--radius-xs)",
            marginBottom: "16px",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          <div
            style={{
              width: "100%",
              height: "14px",
              backgroundColor: "var(--bg-hover)",
              borderRadius: "var(--radius-xs)",
              animation: "pulse 1.5s ease-in-out infinite",
              opacity: 0.4
            }}
          />
          <div
            style={{
              width: "90%",
              height: "14px",
              backgroundColor: "var(--bg-hover)",
              borderRadius: "var(--radius-xs)",
              animation: "pulse 1.5s ease-in-out infinite",
              opacity: 0.4
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "40px" }}>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              style={{
                width: "48px",
                height: "16px",
                backgroundColor: "var(--bg-hover)",
                borderRadius: "var(--radius-xs)",
                animation: "pulse 1.5s ease-in-out infinite",
                opacity: 0.3
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </article>
  );
}

export function ProfileSkeleton() {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-page)",
        borderRadius: "var(--radius-sm)",
        padding: "48px",
        marginBottom: "24px",
        boxShadow: "none",
        border: "0.5px solid var(--border-hairline)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "128px",
          height: "128px",
          borderRadius: "var(--radius-sm)",
          backgroundColor: "var(--bg-hover)",
          margin: "0 auto 32px",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: "240px",
          height: "32px",
          backgroundColor: "var(--bg-hover)",
          borderRadius: "var(--radius-xs)",
          margin: "0 auto 16px",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: "180px",
          height: "18px",
          backgroundColor: "var(--bg-hover)",
          borderRadius: "var(--radius-xs)",
          margin: "0 auto",
          animation: "pulse 1.5s ease-in-out infinite",
          opacity: 0.6
        }}
      />
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
