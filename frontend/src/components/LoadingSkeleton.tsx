export function PostCardSkeleton() {
  return (
    <article
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "50px",
        padding: "35px",
        marginBottom: "16px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e4e7eb",
      }}
    >
      {/* User header skeleton */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "20px", borderBottom: "2px solid #f5f7fa" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "#e4e7eb",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              width: "120px",
              height: "16px",
              backgroundColor: "#e4e7eb",
              borderRadius: "4px",
              marginBottom: "6px",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              width: "80px",
              height: "12px",
              backgroundColor: "#e4e7eb",
              borderRadius: "4px",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>
        <div
          style={{
            width: "60px",
            height: "12px",
            backgroundColor: "#e4e7eb",
            borderRadius: "4px",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>

      {/* Title skeleton */}
      <div
        style={{
          width: "70%",
          height: "24px",
          backgroundColor: "#e4e7eb",
          borderRadius: "4px",
          marginBottom: "12px",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />

      {/* Content skeleton */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            width: "100%",
            height: "16px",
            backgroundColor: "#e4e7eb",
            borderRadius: "4px",
            marginBottom: "8px",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            width: "90%",
            height: "16px",
            backgroundColor: "#e4e7eb",
            borderRadius: "4px",
            marginBottom: "8px",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            width: "75%",
            height: "16px",
            backgroundColor: "#e4e7eb",
            borderRadius: "4px",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>

      {/* Actions skeleton */}
      <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
        <div
          style={{
            width: "60px",
            height: "32px",
            backgroundColor: "#e4e7eb",
            borderRadius: "16px",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            width: "60px",
            height: "32px",
            backgroundColor: "#e4e7eb",
            borderRadius: "16px",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>

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
