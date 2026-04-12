import { useNavigate } from "react-router-dom";
import { 
    CaretLeft, 
    InstagramLogo, 
    WhatsappLogo, 
    TwitterLogo,
    Wrench,
    Eye,
    ChartBar,
    Rocket
} from "phosphor-react";

export default function AboutUs() {
    const navigate = useNavigate();

    return (
        <div className="fade-in" style={{ padding: "64px 24px", maxWidth: "800px", margin: "0 auto", backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "none",
                    border: "none",
                    color: "var(--text-tertiary)",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                    marginBottom: "48px",
                    padding: 0,
                    transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
            >
                <CaretLeft size={16} weight="bold" />
                Back
            </button>

            <h1 style={{ fontSize: "48px", fontWeight: 950, color: "var(--text-primary)", marginBottom: "32px", letterSpacing: "-0.05em", lineHeight: 1 }}>
                About Codeown
            </h1>

            <div style={{ color: "var(--text-primary)", lineHeight: "1.7", fontSize: "20px", fontWeight: 500, marginBottom: "48px", letterSpacing: "-0.01em" }}>
                The world doesn’t need another gallery of polished projects. It needs a workshop where the real building happens.
            </div>

            <div style={{ color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "16px", display: "flex", flexDirection: "column", gap: "24px", marginBottom: "64px" }}>
                <p>
                    Codeown is the dedicated space for developers and founders who believe that messy progress beats perfect silence. We moved away from the "Showroom" culture to build a raw, transparent community where the struggle is just as important as the launch.
                </p>

                <div style={{ marginTop: "32px" }}>
                    <h2 style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "32px" }}>
                        Our Philosophy
                    </h2>

                    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                        <PhilosophyItem 
                            icon={Wrench}
                            title="The Workshop, Not the Showroom" 
                            description="We celebrate raw updates, broken code, and late-night refactors." 
                        />
                        <PhilosophyItem 
                            icon={ChartBar}
                            title="Proof of Build" 
                            description="Your rank is earned through consistency and community support, not just vanity metrics." 
                        />
                        <PhilosophyItem 
                            icon={Eye}
                            title="Radical Transparency" 
                            description="Sharing your 'Stuck' moments is the fastest way to grow and help others grow." 
                        />
                    </div>
                </div>

                <div style={{ marginTop: "48px" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "20px", letterSpacing: "-0.02em" }}>
                        Why we exist
                    </h2>
                    <p>
                        We built Codeown for the builders who spend hours fighting bugs, the founders shipping their first 100 users, and the developers who know that every great product started as a "messy WIP."
                    </p>
                </div>

                <div style={{ 
                    marginTop: "48px", 
                    padding: "32px", 
                    background: "var(--bg-hover)", 
                    borderRadius: "var(--radius-md)", 
                    border: "1px solid var(--border-hairline)",
                    textAlign: "center" 
                }}>
                    <Rocket size={32} weight="fill" style={{ marginBottom: "16px", color: "var(--text-primary)" }} />
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "8px" }}>Don't wait for perfection.</div>
                    <div style={{ fontSize: "28px", fontWeight: 950, color: "var(--text-primary)", letterSpacing: "-0.04em" }}>Just ship it.</div>
                </div>

                <div style={{ marginTop: "64px", padding: "40px 0", borderTop: "0.5px solid var(--border-hairline)" }}>
                    <h2 style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", marginBottom: "24px", textTransform: "uppercase" }}>Connect with us</h2>
                    <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
                        <SocialLink href="https://www.instagram.com/neocode.io" icon={InstagramLogo} label="Instagram" />
                        <SocialLink href="https://api.whatsapp.com/send?phone=966559281499" icon={WhatsappLogo} label="WhatsApp" />
                        <SocialLink href="https://twitter.com/amincodes" icon={TwitterLogo} label="Twitter" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function PhilosophyItem({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "14px", 
                backgroundColor: "var(--bg-hover)", 
                border: "1px solid var(--border-hairline)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "var(--text-primary)"
            }}>
                <Icon size={24} weight="regular" />
            </div>
            <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>{title}</h3>
                <p style={{ fontSize: "14.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{description}</p>
            </div>
        </div>
    )
}

function SocialLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-primary)", fontWeight: 700, textDecoration: "none", transition: "all 0.15s ease", fontSize: "13px" }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
            <Icon size={20} weight="thin" />
            {label}
        </a>
    );
}
