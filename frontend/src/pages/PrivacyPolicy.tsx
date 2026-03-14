import { useNavigate } from "react-router-dom";
import { CaretLeft } from "phosphor-react";

export default function PrivacyPolicy() {
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
                PRIVACY POLICY
            </h1>
            <p style={{ color: "var(--text-tertiary)", fontWeight: 700, fontSize: "11px", marginBottom: "48px", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-mono)" }}>
                Last updated: 2026/01/27
            </p>

            <div style={{ color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "15px", display: "flex", flexDirection: "column", gap: "48px" }}>
                <p style={{ fontSize: "16px", color: "var(--text-primary)", fontWeight: 500 }}>
                    Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our website.
                </p>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>1. INFORMATION WE COLLECT</h2>
                    <p>We may collect the following information:</p>
                    <ul style={{ paddingLeft: "24px", marginTop: "12px", listStyleType: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> Personal information such as name and email address when you create an account.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> Account-related data such as projects, posts, or content you submit.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> Technical data such as IP address, browser type, and cookies.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>2. HOW WE USE YOUR INFORMATION</h2>
                    <p>We use the collected information to:</p>
                    <ul style={{ paddingLeft: "24px", marginTop: "12px", listStyleType: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> Provide and maintain our services.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> Manage user accounts and authentication.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> Improve the performance and user experience of the website.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> Communicate with users regarding updates or support.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>3. PAYMENT PROCESSING</h2>
                    <p>We use Lemon Squeezy for payment processing. We do not store your credit card information on our servers. All payment data is handled securely by Lemon Squeezy in accordance with their privacy policy.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>4. DATA PROTECTION</h2>
                    <p>We take reasonable technical and organizational measures to protect your data from unauthorized access, loss, or misuse.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>5. SHARING OF INFORMATION</h2>
                    <p>We do not sell or rent your personal information. We may share data only when required by law or to protect our legal rights.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>6. COOKIES</h2>
                    <p>We may use cookies to enhance user experience and analyze website usage. You can disable cookies through your browser settings.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>7. USER RIGHTS</h2>
                    <p>You have the right to:</p>
                    <ul style={{ paddingLeft: "24px", marginTop: "12px", listStyleType: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> Access your personal data.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> Update or correct your information.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>—</span> Request deletion of your account and data.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>8. CHANGES TO THIS POLICY</h2>
                    <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>9. CONTACT US</h2>
                    <p>If you have any questions about this Privacy Policy, please contact us at:</p>
                    <a href="mailto:codeown.neocode@outlook.com" style={{ color: "var(--text-primary)", fontWeight: 700, textDecoration: "underline", fontFamily: "var(--font-mono)", fontSize: "14px" }}>codeown.neocode@outlook.com</a>
                </section>
            </div>
        </div>
    );
}
