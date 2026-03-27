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

            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.04em" }}>
                Privacy policy
            </h1>
            <p style={{ color: "var(--text-tertiary)", fontWeight: 600, fontSize: "12px", marginBottom: "48px" }}>
                Last updated: 2026/01/27
            </p>

            <div style={{ color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "15px", display: "flex", flexDirection: "column", gap: "48px" }}>
                <p style={{ fontSize: "16px", color: "var(--text-primary)", fontWeight: 500 }}>
                    Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our website.
                </p>

                <section>
                    <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>1. Information we collect</h2>
                    <p>We may collect the following information:</p>
                    <ul style={{ paddingLeft: "24px", marginTop: "12px", listStyleType: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)" }}>—</span> Personal information such as name and email address when you create an account.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)" }}>—</span> Account-related data such as projects, posts, or content you submit.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)" }}>—</span> Technical data such as IP address, browser type, and cookies.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>2. How we use your information</h2>
                    <p>We use the collected information to:</p>
                    <ul style={{ paddingLeft: "24px", marginTop: "12px", listStyleType: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)" }}>—</span> Provide and maintain our services.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)" }}>—</span> Manage user accounts and authentication.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)" }}>—</span> Improve the performance and user experience of the website.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)" }}>—</span> Communicate with users regarding updates or support.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>3. Payment processing</h2>
                    <p>We use Lemon Squeezy for payment processing. We do not store your credit card information on our servers. All payment data is handled securely by Lemon Squeezy in accordance with their privacy policy.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>4. Data protection</h2>
                    <p>We take reasonable technical and organizational measures to protect your data from unauthorized access, loss, or misuse.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>5. Sharing of information</h2>
                    <p>We do not sell or rent your personal information. We may share data only when required by law or to protect our legal rights.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>6. Cookies</h2>
                    <p>We may use cookies to enhance user experience and analyze website usage. You can disable cookies through your browser settings.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>7. User rights</h2>
                    <p>You have the right to:</p>
                    <ul style={{ paddingLeft: "24px", marginTop: "12px", listStyleType: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)" }}>—</span> Access your personal data.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)" }}>—</span> Update or correct your information.</li>
                        <li style={{ display: "flex", gap: "12px" }}><span style={{ color: "var(--text-tertiary)" }}>—</span> Request deletion of your account and data.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>8. Changes to this policy</h2>
                    <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>9. Contact us</h2>
                    <p>If you have any questions about this Privacy Policy, please contact us at:</p>
                    <a href="mailto:codeown.neocode@outlook.com" style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "underline", fontSize: "14px" }}>codeown.neocode@outlook.com</a>
                </section>
            </div>
        </div>
    );
}
