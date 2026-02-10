export function PostCardSkeleton() {
  return (
    <article
      style={{
        backgroundColor: "#ffffff",
        padding: "16px 20px",
        borderBottom: "1px solid #eff3f4",
        display: "flex",
        gap: "12px"
      }}
    >
      {/* Left Column: Avatar skeleton */}
      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#f1f5f9",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>

      {/* Right Column: Content skeleton */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <div
            style={{
              width: "100px",
              height: "14px",
              backgroundColor: "#f1f5f9",
              borderRadius: "4px",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              width: "60px",
              height: "12px",
              backgroundColor: "#f1f5f9",
              borderRadius: "4px",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>

        <div
          style={{
            width: "80%",
            height: "16px",
            backgroundColor: "#f1f5f9",
            borderRadius: "4px",
            marginBottom: "12px",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          <div
            style={{
              width: "100%",
              height: "12px",
              backgroundColor: "#f8fafc",
              borderRadius: "4px",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              width: "90%",
              height: "12px",
              backgroundColor: "#f8fafc",
              borderRadius: "4px",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "40px" }}>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              style={{
                width: "40px",
                height: "14px",
                backgroundColor: "#f8fafc",
                borderRadius: "4px",
                animation: "pulse 1.5s ease-in-out infinite",
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
        backgroundColor: "#ffffff",
        borderRadius: "30px",
        padding: "40px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e4e7eb",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          backgroundColor: "#e4e7eb",
          margin: "0 auto 20px",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: "200px",
          height: "28px",
          backgroundColor: "#e4e7eb",
          borderRadius: "4px",
          margin: "0 auto 12px",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: "150px",
          height: "16px",
          backgroundColor: "#e4e7eb",
          borderRadius: "4px",
          margin: "0 auto",
          animation: "pulse 1.5s ease-in-out infinite",
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
