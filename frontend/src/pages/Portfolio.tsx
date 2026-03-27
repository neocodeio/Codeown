import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { 
  GithubLogo, 
  TwitterLogo, 
  LinkedinLogo, 
  Globe, 
  MapPin, 
  ArrowLeft,
  Rocket,
  IdentificationCard,
  ShareNetwork,
  Download
} from "phosphor-react";
import { SEO } from "../components/SEO";
import { toast } from "react-toastify";
import { toPng } from "html-to-image";
import { useWindowSize } from "../hooks/useWindowSize";
import ShareModal from "../components/ShareModal";

interface PortfolioUser {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  job_title: string | null;
  location: string | null;
  skills: string[] | null;
  github_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  is_pro: boolean;
}

interface PortfolioProject {
  id: number;
  title: string;
  description: string;
  technologies_used: string[];
  cover_image: string | null;
  status: string;
}

export default function Portfolio() {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<PortfolioUser | null>(null);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!username) return;
      try {
        setLoading(true);
        // Fetch user data by username
        const userRes = await api.get(`/users/${username}`);
        const userData = userRes.data;
        setUser(userData);

        // Fetch projects for this user
        if (userData.id) {
          const projectsRes = await api.get(`/users/${userData.id}/projects`);
          setProjects(projectsRes.data || []);
        }
      } catch (error) {
        console.error("Error fetching portfolio data:", error);
        toast.error("User not found");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, [username]);

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleDownload = async () => {
    const element = document.getElementById("portfolio-content");
    if (!element) return;
    
    const originalStyle = element.style.padding;
    // Add extra padding for the image export to look better
    element.style.padding = "40px";
    
    try {
      const dataUrl = await toPng(element, { 
        quality: 1, 
        backgroundColor: "#000",
        style: {
          borderRadius: '0'
        }
      });
      const link = document.createElement('a');
      link.download = `${username}-portfolio.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Could not download portfolio", err);
      toast.error("Failed to generate portfolio image");
    } finally {
      element.style.padding = originalStyle;
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        backgroundColor: "#000", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        color: "#fff",
      }}>
        Loading portfolio...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        backgroundColor: "#000", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        color: "#fff",
        gap: "24px"
      }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>User not found</h1>
        <Link to="/" style={{ color: "#fff", textDecoration: "underline", fontSize: "14px" }}>Return home</Link>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#000", 
      color: "#fff", 
      fontFamily: "Inter, system-ui, sans-serif",
      paddingBottom: isMobile ? "60px" : "100px"
    }}>
      <SEO title={`${user.name} | Portfolio`} description={`${user.job_title || 'Developer'} Portfolio on Codeown`} />
      
      {/* Dynamic Background */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        background: "radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)",
        pointerEvents: "none"
      }} />

      {/* Toolbar */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        padding: isMobile ? "12px 16px" : "20px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        backgroundColor: "rgba(0, 0, 0, 0.5)"
      }}>
        <Link to={`/${user.username}`} style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "8px", 
          color: "rgba(255, 255, 255, 0.6)", 
          textDecoration: "none",
          fontSize: isMobile ? "11px" : "13px",
          fontWeight: 600,
        }}>
          <ArrowLeft size={isMobile ? 14 : 16} /> {isMobile ? "Back" : "Back to profile"}
        </Link>
        <div style={{ display: "flex", gap: isMobile ? "8px" : "12px" }}>
          <button 
            onClick={handleShare}
            style={{
              padding: isMobile ? "8px 12px" : "10px 20px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "var(--radius-sm)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: isMobile ? "11px" : "12px",
              fontWeight: 600,
              transition: "all 0.2s ease"
            }}
          >
            <ShareNetwork size={isMobile ? 14 : 16} /> Share
          </button>
          <button 
            onClick={handleDownload}
            style={{
              padding: isMobile ? "8px 12px" : "10px 24px",
              backgroundColor: "#fff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              color: "#000",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: isMobile ? "11px" : "12px",
              fontWeight: 600,
              transition: "all 0.2s ease"
            }}
          >
            <Download size={isMobile ? 14 : 16} /> {isMobile ? "PNG" : "Download"}
          </button>
        </div>
      </div>

      <main id="portfolio-content" style={{ position: "relative", zIndex: 1, padding: isMobile ? "0 16px" : "0 20px" }}>
        {/* Hero Section */}
        <section style={{ 
          maxWidth: "1100px", 
          margin: "0 auto", 
          padding: isMobile ? "60px 0 40px" : "120px 0 80px",
          textAlign: "center"
        }}>
          <div style={{ 
            position: "relative",
            display: "inline-block",
            marginBottom: isMobile ? "24px" : "40px"
          }}>
            <img 
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=212121&color=fff&bold=true`}
              style={{
                width: isMobile ? "100px" : "140px",
                height: isMobile ? "100px" : "140px",
                borderRadius: "50%",
                border: "2px solid rgba(255, 255, 255, 0.1)",
                padding: "8px",
                objectFit: "cover"
              }}
            />
            {user.is_pro && (
              <span style={{
                position: "absolute",
                bottom: isMobile ? "5px" : "10px",
                right: "0px",
                backgroundColor: "#fff",
                color: "#000",
                fontSize: "10px",
                fontWeight: 600,
                padding: "4px 8px",
                borderRadius: "var(--radius-md)",
              }}>Pro</span>
            )}
          </div>
          
          <h1 style={{ 
            fontSize: isMobile ? "40px" : "calc(2.5rem + 3vw)", 
            fontWeight: 800, 
            lineHeight: 1, 
            letterSpacing: "-0.04em",
            marginBottom: "16px",
          }}>
            {user.name}
          </h1>
          <p style={{ 
            fontSize: isMobile ? "16px" : "20px", 
            color: "rgba(255, 255, 255, 0.6)", 
            maxWidth: "600px", 
            margin: "0 auto 32px",
            lineHeight: 1.6
          }}>
            {user.job_title || "Full-Stack Developer"}
          </p>

          <div style={{ 
            display: "flex", 
            flexWrap: "wrap",
            justifyContent: "center", 
            gap: isMobile ? "16px" : "24px",
            color: "rgba(255, 255, 255, 0.4)",
            fontSize: isMobile ? "13px" : "15px",
          }}>
            {user.location && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={16} /> {user.location.toUpperCase()}
              </span>
            )}
            {user.website_url && (
              <a href={user.website_url.startsWith('http') ? user.website_url : `https://${user.website_url}`} target="_blank" style={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
                <Globe size={16} /> Website
              </a>
            )}
          </div>
        </section>

        {/* Bio Section */}
        <section style={{ maxWidth: "800px", margin: isMobile ? "0 auto 60px" : "0 auto 120px" }}>
          <div style={{ 
            padding: isMobile ? "32px 24px" : "60px", 
            backgroundColor: "rgba(255, 255, 255, 0.02)", 
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "var(--radius-md)",
            position: "relative",
            overflow: "hidden" // Fix for floating elements
          }}>
            <IdentificationCard size={32} style={{ 
              position: "absolute", 
              top: isMobile ? "16px" : "30px", 
              right: isMobile ? "16px" : "30px", // Moved to inside the box
              color: "rgba(255, 255, 255, 0.1)",
              zIndex: 0
            }} />
            <p style={{ 
              fontSize: isMobile ? "18px" : "24px", 
              lineHeight: 1.6, 
              color: "rgba(255, 255, 255, 0.8)",
              margin: 0,
              position: "relative",
              zIndex: 1
            }}>
              {user.bio || "Building the future of the web, one line of code at a time."}
            </p>
          </div>
        </section>

        {/* Projects Section */}
        <section style={{ maxWidth: "1100px", margin: isMobile ? "0 auto 80px" : "0 auto 120px" }}>
          <div style={{ 
            display: "flex", 
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between", 
            alignItems: isMobile ? "flex-start" : "flex-end", 
            marginBottom: isMobile ? "40px" : "60px",
            gap: "16px"
          }}>
            <div>
              <label style={{ 
                fontSize: "12px", 
                color: "rgba(255, 255, 255, 0.4)",
                display: "block",
                marginBottom: "12px",
                fontWeight: 600
              }}>Portfolio</label>
              <h2 style={{ fontSize: isMobile ? "32px" : "40px", fontWeight: 800 }}>Selected works</h2>
            </div>
            <div style={{ fontSize: isMobile ? "12px" : "14px", color: "rgba(255, 255, 255, 0.6)", fontWeight: 600 }}>
              {projects.length} Projects
            </div>
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(400px, 1fr))", 
            gap: isMobile ? "48px" : "40px" 
          }}>
            {projects.map((project, idx) => (
              <article key={project.id} style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "20px"
              }}>
                <div style={{
                  width: "100%",
                  aspectRatio: "16/10",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  border: "1px solid rgba(255, 255, 255, 0.05)"
                }}>
                  {project.cover_image ? (
                    <img 
                      src={project.cover_image} 
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                      className="project-img"
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Rocket size={48} weight="thin" style={{ opacity: 0.1 }} />
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "12px"
                  }}>
                    <h3 style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: 800 }}>{project.title}</h3>
                    <span style={{ 
                      fontSize: "11px", 
                      color: "rgba(255, 255, 255, 0.4)",
                      padding: "4px 8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "var(--radius-sm)",
                      fontWeight: 600
                    }}>
                      0{idx + 1}
                    </span>
                  </div>
                  <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: isMobile ? "14px" : "16px", lineHeight: 1.6, marginBottom: "20px" }}>
                    {project.description}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {project.technologies_used.map(tech => (
                      <span key={tech} style={{
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.8)",
                        padding: "4px 0",
                        marginRight: "16px",
                        fontWeight: 600
                      }}>#{tech}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Skills Section */}
        <section style={{ maxWidth: "1100px", margin: isMobile ? "0 auto 80px" : "0 auto 120px" }}>
          <div style={{ 
            padding: isMobile ? "40px 20px" : "80px", 
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "var(--radius-sm)"
          }}>
            <h2 style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255, 255, 255, 0.4)", marginBottom: isMobile ? "32px" : "40px", textAlign: "center" }}>Technical stack</h2>
            <div style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              justifyContent: "center", 
              gap: isMobile ? "12px" : "16px" 
            }}>
              {user.skills?.map(skill => (
                <span key={skill} style={{
                  fontSize: isMobile ? "20px" : "32px",
                  fontWeight: 800,
                  color: isMobile ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.2)",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => { if(!isMobile) e.currentTarget.style.color = "#fff"} }
                onMouseLeave={(e) => { if(!isMobile) e.currentTarget.style.color = "rgba(255, 255, 255, 0.2)"} }
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Footer */}
        <section style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center", paddingBottom: "60px" }}>
          <h2 style={{ fontSize: isMobile ? "32px" : "calc(1.5rem + 2vw)", fontWeight: 800, marginBottom: "40px" }}>Let's build something.<br/>Together.</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: "40px" }}>
            {user.github_url && <a href={user.github_url} target="_blank" style={{ color: "#fff", opacity: 0.6 }}><GithubLogo size={isMobile ? 28 : 32} /></a>}
            {user.twitter_url && <a href={user.twitter_url} target="_blank" style={{ color: "#fff", opacity: 0.6 }}><TwitterLogo size={isMobile ? 28 : 32} /></a>}
            {user.linkedin_url && <a href={user.linkedin_url} target="_blank" style={{ color: "#fff", opacity: 0.6 }}><LinkedinLogo size={isMobile ? 28 : 32} /></a>}
          </div>
        </section>
      </main>

      <footer style={{ 
        textAlign: "center", 
        padding: "40px", 
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        color: "rgba(255, 255, 255, 0.3)",
        fontSize: "12px",
        fontWeight: 600
      }}>
        Published via codeown © {new Date().getFullYear()}
      </footer>

      {/* Share Modal Integration */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        url={window.location.href} 
        title={`Share ${user.name}'s Portfolio`} 
      />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        #portfolio-content > section { animation: fadeIn 0.8s ease-out forwards; }
        .project-img:hover { transform: scale(1.05); }
      `}</style>
    </div>
  );
}
