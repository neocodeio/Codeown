import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="fade-in" style={{ padding: "60px 20px", maxWidth: "800px", margin: "0 auto" }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    fontWeight: 700,
                    cursor: "pointer",
                    marginBottom: "32px",
                    padding: 0
                }}
            >
                <FontAwesomeIcon icon={faArrowLeft} />
                BACK
            </button>

            <h1 style={{ fontSize: "42px", fontWeight: 900, color: "#0f172a", marginBottom: "8px", letterSpacing: "-0.04em" }}>
                Privacy Policy
            </h1>
            <p style={{ color: "#94a3b8", fontWeight: 700, fontSize: "14px", marginBottom: "32px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Last updated: 2026/01/27
            </p>

            <div style={{ color: "#475569", lineHeight: "1.8", fontSize: "16px", display: "flex", flexDirection: "column", gap: "32px" }}>
                <p style={{ fontSize: "18px", color: "#1e293b", fontWeight: 500 }}>
                    Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our website.
                </p>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>1. Information We Collect</h2>
                    <p>We may collect the following information:</p>
                    <ul style={{ paddingLeft: "20px", marginTop: "8px", listStyleType: "disc" }}>
                        <li>Personal information such as name and email address when you create an account.</li>
                        <li>Account-related data such as projects, posts, or content you submit.</li>
                        <li>Technical data such as IP address, browser type, and cookies.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>2. How We Use Your Information</h2>
                    <p>We use the collected information to:</p>
                    <ul style={{ paddingLeft: "20px", marginTop: "8px", listStyleType: "disc" }}>
                        <li>Provide and maintain our services.</li>
                        <li>Manage user accounts and authentication.</li>
                        <li>Improve the performance and user experience of the website.</li>
                        <li>Communicate with users regarding updates or support.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>3. Data Protection</h2>
                    <p>We take reasonable technical and organizational measures to protect your data from unauthorized access, loss, or misuse.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>4. Sharing of Information</h2>
                    <p>We do not sell or rent your personal information. We may share data only when required by law or to protect our legal rights.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>5. Cookies</h2>
                    <p>We may use cookies to enhance user experience and analyze website usage. You can disable cookies through your browser settings.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>6. User Rights</h2>
                    <p>You have the right to:</p>
                    <ul style={{ paddingLeft: "20px", marginTop: "8px", listStyleType: "disc" }}>
                        <li>Access your personal data.</li>
                        <li>Update or correct your information.</li>
                        <li>Request deletion of your account and data.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>7. Changes to This Policy</h2>
                    <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>8. Contact Us</h2>
                    <p>If you have any questions about this Privacy Policy, please contact us at:</p>
                    <a href="mailto:codeown.neocode@outlook.com" style={{ color: "#212121", fontWeight: 700, textDecoration: "none" }}>codeown.neocode@outlook.com</a>
                </section>
            </div>
        </div>
    );
}
