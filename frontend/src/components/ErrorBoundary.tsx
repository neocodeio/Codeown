import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, _errorInfo: React.ErrorInfo) {
    const isChunkLoadError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.toLowerCase().includes('failed to fetch dynamically imported module') ||
      error?.message?.toLowerCase().includes('importing a module script failed') ||
      error?.message?.toLowerCase().includes('loading chunk') ||
      error?.message?.toLowerCase().includes('clerk.browser') ||
      error?.message?.toLowerCase().includes('load failed');

    if (isChunkLoadError) {
      console.warn("Update detected - Performing silent refresh to load latest version...");
      // We perform a silent reload immediately to fetch the new code chunks
      // This prevents the user from seeing the 'Something went wrong' screen
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      const isChunkLoadError =
        this.state.error?.name === 'ChunkLoadError' ||
        this.state.error?.message?.toLowerCase().includes('failed to fetch dynamically imported module') ||
        this.state.error?.message?.toLowerCase().includes('importing a module script failed') ||
        this.state.error?.message?.toLowerCase().includes('loading chunk') ||
        this.state.error?.message?.toLowerCase().includes('load failed');

      // If it's a chunk error, we are already triggering a reload in componentDidCatch.
      // We return null here to prevent the "Something went wrong" UI from flashing.
      if (isChunkLoadError) return null;

      return (
        <div style={{
          padding: "80px 24px",
          textAlign: "center",
          minHeight: "100vh",
          backgroundColor: "var(--bg-page)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-primary)"
        }}>
          <div style={{
            padding: "40px",
            border: "0.5px solid var(--border-hairline)",
            backgroundColor: "var(--bg-card)",
            borderRadius: "var(--radius-sm)",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center"
          }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Something went wrong</h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "32px", lineHeight: "1.6" }}>
              {isChunkLoadError
                ? "The application was updated. A refresh is required to continue."
                : (this.state.error?.message || "An unexpected error occurred")}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => {
                  sessionStorage.removeItem('chunk_error_count');
                  window.location.reload();
                }}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "var(--text-primary)",
                  border: "none",
                  color: "var(--bg-page)",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  transition: "opacity 0.15s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                Refresh app
              </button>
              <button
                onClick={() => window.location.href = "/"}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "transparent",
                  border: "0.5px solid var(--border-hairline)",
                  color: "var(--text-primary)",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
