import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function TermsOfService() {
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
                Terms of Service
            </h1>
            <p style={{ color: "#94a3b8", fontWeight: 700, fontSize: "14px", marginBottom: "32px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Last updated: 2026/01/27
            </p>

            <div style={{ color: "#475569", lineHeight: "1.8", fontSize: "16px", display: "flex", flexDirection: "column", gap: "32px" }}>
                <p style={{ fontSize: "18px", color: "#1e293b", fontWeight: 500 }}>
                    By accessing or using this website, you agree to be bound by these Terms of Service. If you do not agree, please do not use the website.
                </p>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>1. Use of the Website</h2>
                    <p>You agree to use the website only for lawful purposes and in a way that does not violate any applicable laws or regulations.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>2. User Accounts</h2>
                    <ul style={{ paddingLeft: "20px", marginTop: "8px", listStyleType: "disc" }}>
                        <li>You are responsible for maintaining the confidentiality of your account.</li>
                        <li>You must provide accurate information when creating an account.</li>
                        <li>You are responsible for all activities that occur under your account.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>3. User Content</h2>
                    <ul style={{ paddingLeft: "20px", marginTop: "8px", listStyleType: "disc" }}>
                        <li>You retain ownership of the content you submit.</li>
                        <li>You grant us the right to display and manage your content on the platform.</li>
                        <li>We reserve the right to remove any content that violates these terms.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>4. Prohibited Activities</h2>
                    <p>Users are not allowed to:</p>
                    <ul style={{ paddingLeft: "20px", marginTop: "8px", listStyleType: "disc" }}>
                        <li>Post illegal, harmful, or abusive content.</li>
                        <li>Attempt to hack, disrupt, or misuse the website.</li>
                        <li>Impersonate others or provide false information.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>5. Limitation of Liability</h2>
                    <p>We are not responsible for any direct or indirect damages resulting from the use of the website.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>6. Termination</h2>
                    <p>We reserve the right to suspend or terminate accounts that violate these Terms of Service.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>7. Changes to the Terms</h2>
                    <p>We may update these Terms at any time. Continued use of the website means you accept the updated terms.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>8. Governing Law</h2>
                    <p>These Terms shall be governed and interpreted according to applicable laws.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>9. Contact</h2>
                    <p>If you have any questions regarding these Terms, please contact us at:</p>
                    <a href="mailto:codeown.neocode@outlook.com" style={{ color: "#212121", fontWeight: 700, textDecoration: "none" }}>codeown.neocode@outlook.com</a>
                </section>
            </div>
        </div>
    );
}
