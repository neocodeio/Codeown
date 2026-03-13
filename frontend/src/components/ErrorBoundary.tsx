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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Auto-refresh the page once if we encounter a dynamic import error (e.g. user has old cached JS but we deployed new chunks)
    const isChunkLoadError = 
      error?.name === 'ChunkLoadError' || 
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed');

    if (isChunkLoadError) {
      const hasRefreshed = sessionStorage.getItem('chunk_error_refreshed');
      if (!hasRefreshed) {
        sessionStorage.setItem('chunk_error_refreshed', 'true');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "40px 20px",
          textAlign: "center",
          minHeight: "calc(100vh - 80px)",
          backgroundColor: "#f5f7fa",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <h2 style={{ marginBottom: "16px", color: "#1a1a1a" }}>Something went wrong</h2>
          <p style={{ color: "#64748b", marginBottom: "24px" }}>
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              window.location.href = "/";
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: "#000",
              border: "none",
              color: "#ffffff",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Go to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
