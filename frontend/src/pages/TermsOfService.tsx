import { useNavigate } from "react-router-dom";
import { CaretLeft } from "phosphor-react";

export default function TermsOfService() {
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
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    fontSize: "11px",
                    cursor: "pointer",
                    marginBottom: "48px",
                    padding: 0,
                    transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
            >
                <CaretLeft size={16} weight="bold" />
                BACK
            </button>

            <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.04em", textTransform: "uppercase" }}>
                TERMS OF SERVICE
            </h1>
            <p style={{ color: "var(--text-tertiary)", fontWeight: 700, fontSize: "11px", marginBottom: "48px", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-mono)" }}>
                Last updated: 2026/01/27
            </p>

            <div style={{ color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "15px", display: "flex", flexDirection: "column", gap: "48px" }}>
                <p style={{ fontSize: "16px", color: "var(--text-primary)", fontWeight: 500 }}>
                    By accessing or using this website, you agree to be bound by these Terms of Service. If you do not agree, please do not use the website.
                </p>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>1. USE OF THE WEBSITE</h2>
                    <p>You agree to use the website only for lawful purposes and in a way that does not violate any applicable laws or regulations.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>2. USER ACCOUNTS</h2>
                    <ul style={{ paddingLeft: "24px", marginTop: "12px", listStyleType: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> You are responsible for maintaining the confidentiality of your account.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> You must provide accurate information when creating an account.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> You are responsible for all activities that occur under your account.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>3. USER CONTENT</h2>
                    <ul style={{ paddingLeft: "24px", marginTop: "12px", listStyleType: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> You retain ownership of the content you submit.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> You grant us the right to display and manage your content on the platform.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> We reserve the right to remove any content that violates these terms.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>4. PROHIBITED ACTIVITIES</h2>
                    <p>Users are not allowed to:</p>
                    <ul style={{ paddingLeft: "24px", marginTop: "12px", listStyleType: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> Post illegal, harmful, or abusive content.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> Attempt to hack, disrupt, or misuse the website.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> Impersonate others or provide false information.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>5. PRO SUBSCRIPTIONS & REFUNDS</h2>
                    <p>For our PRO subscriptions, refunds are handled on a case-by-case basis. If you are unsatisfied with the service, please contact us within 7 days of purchase.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>6. LIMITATION OF LIABILITY</h2>
                    <p>We are not responsible for any direct or indirect damages resulting from the use of the website.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>7. TERMINATION</h2>
                    <p>We reserve the right to suspend or terminate accounts that violate these Terms of Service.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>8. CHANGES TO THE TERMS</h2>
                    <p>We may update these Terms at any time. Continued use of the website means you accept the updated terms.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>9. GOVERNING LAW</h2>
                    <p>These Terms shall be governed and interpreted according to applicable laws.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>10. CONTACT</h2>
                    <p>If you have any questions regarding these Terms, please contact us at:</p>
                    <a href="mailto:codeown.neocode@outlook.com" style={{ color: "var(--text-primary)", fontWeight: 700, textDecoration: "underline", fontFamily: "var(--font-mono)", fontSize: "14px" }}>codeown.neocode@outlook.com</a>
                </section>
            </div>
        </div>
    );
}
