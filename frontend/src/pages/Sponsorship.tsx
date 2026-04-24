import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  ArrowLeft01Icon, 
  Mail01Icon, 
  UserGroupIcon, 
  Chart01Icon, 
  GlobalIcon 
} from "@hugeicons/core-free-icons";
import { SEO } from '../components/SEO';
import { useWindowSize } from "../hooks/useWindowSize";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";

export default function Sponsorship() {
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;

  return (
    <div style={{
      backgroundColor: "var(--bg-page)",
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      padding: "0"
    }}>
      <SEO 
        title="Sponsor Codeown" 
        description="Connect with the world's most passionate builders by sponsoring Codeown." 
      />

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: isDesktop ? "920px" : "100%",
        margin: "0 auto",
      }}>
        {/* ── Main Content Column ── */}
        <div style={{
          width: isDesktop ? "var(--feed-width)" : "100%",
          maxWidth: isDesktop ? "var(--feed-width)" : "600px",
          margin: isDesktop ? "0" : "0 auto",
          flexShrink: 0,
          borderLeft: (isMobile || !isDesktop) ? "none" : "0.5px solid var(--border-hairline)",
          borderRight: "0.5px solid var(--border-hairline)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--bg-page)"
        }}>
          {/* Header */}
          <header style={{
            position: "sticky",
            top: 0,
            backgroundColor: "var(--bg-header)",
            backdropFilter: "blur(24px)",
            zIndex: 100,
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
            borderBottom: "0.5px solid var(--border-hairline)"
          }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-primary)"
              }}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
            </button>
            <h1 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              Sponsor Codeown
            </h1>
          </header>

          {/* Content */}
          <div style={{ padding: isMobile ? "32px 16px" : "48px 32px" }}>
            <div style={{
              textAlign: "center",
              maxWidth: "600px",
              margin: "0 auto 48px"
            }}>
              <h2 style={{ fontSize: isMobile ? "28px" : "32px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "16px", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
                Put your brand in front of the world's top builders
              </h2>
              <p style={{ fontSize: "15px", color: "var(--text-tertiary)", lineHeight: "1.6" }}>
                Codeown is where the next generation of software is being shipped. Connect with passionate developers, founders, and engineers.
              </p>
            </div>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "48px"
            }}>
              <div style={{
                padding: "24px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "rgba(var(--text-primary-rgb), 0.02)",
                border: "1px solid var(--border-hairline)",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start"
              }}>
                <div style={{ color: "#00ba7c", flexShrink: 0, marginTop: "2px" }}>
                  <HugeiconsIcon icon={UserGroupIcon} size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>Engaged Audience</h3>
                  <p style={{ fontSize: "14px", color: "var(--text-tertiary)", margin: 0, lineHeight: "1.5", opacity: 0.8 }}>
                    Reach developers who are actively building and launching new products daily.
                  </p>
                </div>
              </div>

              <div style={{
                padding: "24px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "rgba(var(--text-primary-rgb), 0.02)",
                border: "1px solid var(--border-hairline)",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start"
              }}>
                <div style={{ color: "#0096ff", flexShrink: 0, marginTop: "2px" }}>
                  <HugeiconsIcon icon={GlobalIcon} size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>Global Visibility</h3>
                  <p style={{ fontSize: "14px", color: "var(--text-tertiary)", margin: 0, lineHeight: "1.5", opacity: 0.8 }}>
                    Your brand placed in the most visible areas of the platform across all devices.
                  </p>
                </div>
              </div>

              <div style={{
                padding: "24px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "rgba(var(--text-primary-rgb), 0.02)",
                border: "1px solid var(--border-hairline)",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start"
              }}>
                <div style={{ color: "#a855f7", flexShrink: 0, marginTop: "2px" }}>
                  <HugeiconsIcon icon={Chart01Icon} size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>Real Impact</h3>
                  <p style={{ fontSize: "14px", color: "var(--text-tertiary)", margin: 0, lineHeight: "1.5", opacity: 0.8 }}>
                    Support the community and build brand equity with the creators who matter.
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              padding: isMobile ? "32px 24px" : "40px",
              borderRadius: "var(--radius-xl)",
              backgroundColor: "var(--text-primary)",
              color: "var(--bg-page)",
              textAlign: "center"
            }}>
              <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "12px" }}>Ready to partner?</h3>
              <p style={{ fontSize: "14px", opacity: 0.8, marginBottom: "32px", maxWidth: "450px", margin: "0 auto 32px" }}>
                Send us an inquiry and let's discuss how we can bring your brand to life on Codeown.
              </p>
              <a
                href="mailto:ameen65022@gmail.com"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  backgroundColor: "var(--bg-page)",
                  color: "var(--text-primary)",
                  padding: "12px 24px",
                  borderRadius: "100px",
                  textDecoration: "none",
                  fontWeight: 800,
                  fontSize: "13px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                <HugeiconsIcon icon={Mail01Icon} size={16} />
                ameen65022@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        {isDesktop && (
          <aside style={{
            width: "335px",
            position: "sticky",
            top: 0,
            alignSelf: "flex-start",
            flexShrink: 0,
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            borderRight: "0.5px solid var(--border-hairline)"
          }}>
            <RecommendedUsersSidebar />
          </aside>
        )}
      </div>
    </div>
  );
}
