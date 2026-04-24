import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Menu01Icon,
  Cancel01Icon,
  Notification01Icon,
  WorkIcon,
  Rocket01Icon,
  DocumentCodeIcon,
  MedalIcon
} from "@hugeicons/core-free-icons";
import { useTheme } from "../context/ThemeContext";
import { SEO } from "../components/SEO";
import { useWindowSize } from "../hooks/useWindowSize";
import { useState, useEffect } from "react";
import { useClerkUser } from "../hooks/useClerkUser";
import logo from "../assets/icon-removebg.png";
import logoWhite from "../assets/logo-white.png";

export default function Landing() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { width } = useWindowSize();
  const { isSignedIn, isLoaded } = useClerkUser();
  const isMobile = width < 768;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  const primaryLogo = theme === "dark" ? logoWhite : logo;

  return (
    <div style={{
      backgroundColor: "var(--bg-page)",
      minHeight: "100vh",
      width: "100%",
      overflowX: "hidden",
      fontFamily: "'Instrument Sans', sans-serif",
      color: "var(--text-primary)"
    }}>
      <SEO 
        title="Codeown — Stop shipping into the void." 
        description="The digital home for builders. Showcase your projects, get honest feedback, and connect with founders." 
      />

      {/* ── Navigation ── */}
      <nav style={{
        position: "fixed",
        top: isMobile ? "12px" : "10px",
        left: "50%",
        transform: "translateX(-50%)",
        width: isMobile ? "calc(100% - 24px)" : "fit-content",
        minWidth: isMobile ? "0" : "900px",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(var(--bg-page-rgb), 0.8)",
        backdropFilter: "blur(24px)",
        zIndex: 1000,
        borderRadius: "100px",
        border: "0.5px solid var(--border-hairline)",
        transition: "all 0.3s ease"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => navigate("/")}>
          <img src={primaryLogo} alt="Codeown" style={{ height: "22px" }} />
          <span style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "-0.03em" }}>Codeown</span>
        </div>

        {/* Desktop Links */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button onClick={() => navigate("/")} style={navLinkStyle()}>Home</button>
            <button onClick={() => navigate("/startups")} style={navLinkStyle()}>Startups</button>
            <button onClick={() => navigate("/directory")} style={navLinkStyle()}>Builders</button>
            <button onClick={() => navigate("/changelog")} style={navLinkStyle()}>Changelog</button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {!isMobile && (
            <button 
              onClick={() => navigate("/sign-in")}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                padding: "8px 12px"
              }}
            >
              Log in
            </button>
          )}
          <button 
            onClick={() => navigate("/sign-up")}
            style={{
              backgroundColor: "var(--text-primary)",
              color: "var(--bg-page)",
              border: "none",
              borderRadius: "100px",
              padding: "10px 20px",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            Join now
          </button>
          {isMobile && (
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ background: "none", border: "none", color: "var(--text-primary)", display: "flex", padding: "8px" }}
            >
              <HugeiconsIcon icon={isMenuOpen ? Cancel01Icon : Menu01Icon} size={20} />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobile && isMenuOpen && (
        <div style={{
          position: "fixed",
          top: "80px",
          left: "12px",
          right: "12px",
          backgroundColor: "var(--bg-page)",
          border: "0.5px solid var(--border-hairline)",
          borderRadius: "24px",
          padding: "24px",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          animation: "slideDown 0.3s ease-out"
        }}>
           <button onClick={() => navigate("/")} style={mobileNavLinkStyle}>Home</button>
           <button onClick={() => navigate("/startups")} style={mobileNavLinkStyle}>Startups</button>
           <button onClick={() => navigate("/directory")} style={mobileNavLinkStyle}>Builders</button>
           <button onClick={() => navigate("/changelog")} style={mobileNavLinkStyle}>Changelog</button>
           <hr style={{ border: "none", borderTop: "0.5px solid var(--border-hairline)", margin: "8px 0" }} />
           <button onClick={() => navigate("/sign-in")} style={mobileNavLinkStyle}>Log in</button>
           <button onClick={() => navigate("/sign-up")} style={{ ...mobileNavLinkStyle, color: "var(--text-primary)" }}>Join now — Free</button>
        </div>
      )}

      {/* ── Hero Section ── */}
      <section style={{
        padding: isMobile ? "140px 24px 80px" : "200px 24px 140px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderBottom: "0.5px solid var(--border-hairline)"
      }}>
        <h1 style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: isMobile ? "54px" : "110px",
          fontWeight: 400,
          fontStyle: "italic",
          lineHeight: 1.2,
          letterSpacing: "-0.04em",
          maxWidth: "1000px",
          marginBottom: "32px",
          color: "var(--text-primary)"
        }}>
          Stop <span style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-page)", padding: "0 14px", fontFamily: "'Instrument Serif', serif" }}>shipping</span> into the void.
        </h1>
        
        <p style={{
          fontSize: isMobile ? "18px" : "23px",
          color: "var(--text-secondary)",
          maxWidth: "680px",
          lineHeight: "1.5",
          marginBottom: "56px",
          fontWeight: 500,
          letterSpacing: "-0.01em"
        }}>
          Codeown is where real builders share progress, get feedback, and grow together. No noise, just developers building the future.
        </p>

        <button 
          onClick={() => navigate("/sign-up")}
          style={{
            backgroundColor: "var(--text-primary)",
            color: "var(--bg-page)",
            padding: isMobile ? "18px 36px" : "20px 30px",
            fontSize: "18px",
            fontWeight: 800,
            borderRadius: "100px",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            transition: "transform 0.2s cubic-bezier(0.2, 0, 0, 1)"
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
        >
          Join 120+ Builders
          <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
        </button>
      </section>

      {/* ── Grid / Mission Section ── */}
      <section style={{
        padding: isMobile ? "80px 24px" : "120px 24px",
        // borderBottom: "0.5px solid var(--border-hairline)"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
            gap: isMobile ? "48px" : "80px",
            alignItems: "start"
          }}>
            <div>
              <h2 style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: isMobile ? "42px" : "68px",
                fontWeight: 400,
                lineHeight: 1.2,
                marginBottom: "32px",
                fontStyle: "italic"
              }}>
                The digital home for <span style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-page)", padding: "0px 14px", fontFamily: "'Instrument Serif', serif" }}>builders.</span>
              </h2>
              <p style={{
                fontSize: "20px",
                color: "var(--text-secondary)",
                lineHeight: "1.6",
                marginBottom: "48px",
                fontWeight: 500
              }}>
                A social platform to showcase your projects, get honest feedback, and find your next teammate.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <FeatureItem text="Build in public." />
                <FeatureItem text="Get real feedback." />
                <FeatureItem text="Connect with founders." />
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "24px"
            }}>
              <div style={cardStyle()}>
                <div style={iconBoxStyle()}><HugeiconsIcon icon={WorkIcon} size={24} /></div>
                <h4 style={cardTitleStyle()}>Build in Public</h4>
                <p style={cardDescStyle()}>Share your progress and get feedback from other builders.</p>
              </div>
              <div style={cardStyle()}>
                <div style={iconBoxStyle()}><HugeiconsIcon icon={Notification01Icon} size={24} /></div>
                <h4 style={cardTitleStyle()}>Real-time Feedback</h4>
                <p style={cardDescStyle()}>Instantly hear from other developers as you ship features or fix bugs.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEW: Engineered for Velocity Section ── */}
      <section style={{
        padding: isMobile ? "80px 24px" : "120px 24px",
        backgroundColor: "rgba(var(--text-primary-rgb), 0.01)",
        // borderBottom: "0.5px solid var(--border-hairline)"
        border: "1px solid var(--border-hairline)",
        borderRadius: "30px",
        boxShadow: "0 0 0 0.5px var(--border-hairline)"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: isMobile ? "40px" : "72px",
            fontWeight: 400,
            fontStyle: "italic",
            marginBottom: "64px"
          }}>
            Engineered for <span style={{ textDecoration: "underline", textUnderlineOffset: "8px" }}>Velocity</span>.
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: "0.5px",
            borderRadius: "30px",
            backgroundColor: "var(--border-hairline)",
            border: "0.5px solid var(--border-hairline)",
            overflow: "hidden"
          }}>
            <VelocityCard 
              title="Proof over Promises" 
              desc="Let your actual progress be your professional identity." 
              icon={DocumentCodeIcon}
            />
            <VelocityCard 
              title="High-Signal Network" 
              desc="No recruiters, no fluff. Just pure engineering vibes." 
              icon={Rocket01Icon}
            />
            <VelocityCard 
              title="Collective Growth" 
              desc="Learn from the ships of others and level up together." 
              icon={MedalIcon}
            />
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section style={{
        padding: isMobile ? "100px 24px" : "160px 24px",
        textAlign: "center"
      }}>
        <div style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "40px",
          maxWidth: "800px"
        }}>
          <h3 style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: isMobile ? "46px" : "84px",
            fontWeight: 400,
            fontStyle: "italic",
            lineHeight: 1,
            letterSpacing: "-0.04em"
          }}>
            Real builders build here.
          </h3>
          <button 
            onClick={() => navigate("/sign-up")}
            style={{
              backgroundColor: "var(--text-primary)",
              color: "var(--bg-page)",
              padding: "20px 30px",
              fontSize: "19px",
              fontWeight: 800,
              borderRadius: "100px",
              border: "none",
              cursor: "pointer"
            }}
          >
            Create your account
          </button>
          <div style={{ fontSize: "14px", fontWeight: 700, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Join a network of 120+ Builders
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: "80px 24px",
        backgroundColor: "var(--bg-page)"
      }}>
        <div style={{ 
          maxWidth: "1200px", 
          margin: "0 auto", 
          display: "flex", 
          flexDirection: isMobile ? "column" : "row", 
          justifyContent: "space-between", 
          alignItems: isMobile ? "center" : "flex-start", 
          gap: "60px"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", justifyContent: isMobile ? "center" : "flex-start" }}>
              <img src={primaryLogo} alt="Codeown" style={{ height: "24px" }} />
              <span style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "-0.03em" }}>Codeown</span>
            </div>
            <p style={{ color: "var(--text-tertiary)", fontSize: "15px", maxWidth: "280px", textAlign: isMobile ? "center" : "left", lineHeight: "1.5", fontWeight: 500 }}>
              The digital heartbeat of builders, founders, and shipooors. Built for the future.
            </p>
          </div>

          <div style={{ display: "flex", gap: isMobile ? "40px" : "100px", textAlign: isMobile ? "center" : "left" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <h5 style={{ fontWeight: 800, fontSize: "13px", color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Platform</h5>
              <button onClick={() => navigate("/")} style={footerLinkStyle()}>Home</button>
              <button onClick={() => navigate("/startups")} style={footerLinkStyle()}>Startups</button>
              <button onClick={() => navigate("/directory")} style={footerLinkStyle()}>Builders</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <h5 style={{ fontWeight: 800, fontSize: "13px", color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Resources</h5>
              <button onClick={() => navigate("/changelog")} style={footerLinkStyle()}>Changelog</button>
              <button onClick={() => navigate("/privacy")} style={footerLinkStyle()}>Privacy</button>
              <button onClick={() => navigate("/terms")} style={footerLinkStyle()}>Terms</button>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Components & Styles ──

function FeatureItem({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} style={{ color: "var(--text-primary)" }} />
      <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>{text}</span>
    </div>
  );
}

function VelocityCard({ title, desc, icon: Icon }: any) {
  return (
    <div style={{
      backgroundColor: "var(--bg-page)",
      padding: "54px 32px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: "20px"
    }}>
      <div style={{ color: "var(--text-primary)", opacity: 0.8 }}>
        {Icon && <HugeiconsIcon icon={Icon} size={32} />}
      </div>
      <h4 style={{ fontSize: "20px", fontWeight: 800 }}>{title}</h4>
      <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.6, fontWeight: 500 }}>{desc}</p>
    </div>
  );
}

const cardStyle = (): React.CSSProperties => ({
  backgroundColor: "rgba(var(--text-primary-rgb), 0.01)",
  border: "0.5px solid var(--border-hairline)",
  borderRadius: "24px",
  padding: "32px",
  display: "flex",
  flexDirection: "column",
  gap: "16px"
});

const iconBoxStyle = (): React.CSSProperties => ({
  height: "44px",
  width: "44px",
  borderRadius: "12px",
  backgroundColor: "var(--text-primary)",
  color: "var(--bg-page)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
});

const cardTitleStyle = (): React.CSSProperties => ({
  fontSize: "20px",
  fontWeight: 800,
  letterSpacing: "-0.01em"
});

const cardDescStyle = (): React.CSSProperties => ({
  fontSize: "15px",
  color: "var(--text-secondary)",
  lineHeight: 1.5,
  fontWeight: 500
});

function navLinkStyle(): React.CSSProperties {
  return {
    background: "none",
    border: "none",
    color: "var(--text-secondary)",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
    padding: "8px 16px",
    borderRadius: "100px",
    transition: "all 0.2s"
  };
}

const mobileNavLinkStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--text-secondary)",
  fontWeight: 700,
  fontSize: "18px",
  cursor: "pointer",
  textAlign: "left",
  padding: "8px 0"
};

function footerLinkStyle(): React.CSSProperties {
  return {
    background: "none",
    border: "none",
    color: "var(--text-tertiary)",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
    padding: 0,
    textAlign: "inherit"
  }
}
