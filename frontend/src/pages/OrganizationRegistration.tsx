import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";


export default function OrganizationRegistration() {

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        website: "",
        domain_email: "",
        description: "",
        location: "",
        size: "1-10",
        industry: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.post("/organizations", formData);
            setSuccess(true);
            setTimeout(() => navigate("/profile"), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to register organization");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    if (success) {
        return (
            <div className="container" style={{ padding: "100px 20px", textAlign: "center" }}>
                <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px", backgroundColor: "#fff", borderRadius: "20px", border: "2px solid #6366f1" }}>
                    <h1 style={{ fontSize: "32px", color: "#6366f1", marginBottom: "20px" }}>Application Submitted! 🚀</h1>
                    <p style={{ fontSize: "18px", lineHeight: "1.6" }}>
                        Thank you for registering <strong>{formData.name}</strong>. Our team will review your application and verify your domain email.
                        You will receive an email once your account is approved.
                    </p>
                    <p style={{ marginTop: "20px", color: "var(--text-secondary)" }}>Redirecting to your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: "60px 20px" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <header style={{ marginBottom: "40px" }}>
                    <h1 style={{ fontSize: "40px", marginBottom: "10px" }}>Register Organization</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "18px" }}>
                        Join Codeown as a company to find, contact, and hire top developer talent.
                    </p>
                </header>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px", backgroundColor: "#fff", padding: "40px", borderRadius: "24px", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
                    {error && (
                        <div style={{ padding: "16px", backgroundColor: "#fee2e2", color: "#ef4444", borderRadius: "12px", border: "1px solid #fecaca", fontWeight: 600 }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontWeight: 700, fontSize: "14px" }}>COMPANY NAME *</label>
                            <input
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Acme Inc"
                                style={{ padding: "12px 16px", borderRadius: "12px", border: "2px solid #364182", outline: "none" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontWeight: 700, fontSize: "14px" }}>DOMAIN EMAIL *</label>
                            <input
                                required
                                type="email"
                                name="domain_email"
                                value={formData.domain_email}
                                onChange={handleChange}
                                placeholder="hr@acme.com"
                                style={{ padding: "12px 16px", borderRadius: "12px", border: "2px solid #364182", outline: "none" }}
                            />
                            <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Must be a professional email address for verification.</span>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontWeight: 700, fontSize: "14px" }}>WEBSITE</label>
                            <input
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://acme.com"
                                style={{ padding: "12px 16px", borderRadius: "12px", border: "2px solid #364182", outline: "none" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontWeight: 700, fontSize: "14px" }}>INDUSTRY</label>
                            <input
                                name="industry"
                                value={formData.industry}
                                onChange={handleChange}
                                placeholder="e.g. Software, Fintech"
                                style={{ padding: "12px 16px", borderRadius: "12px", border: "2px solid #364182", outline: "none" }}
                            />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontWeight: 700, fontSize: "14px" }}>LOCATION</label>
                            <input
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="San Francisco, CA"
                                style={{ padding: "12px 16px", borderRadius: "12px", border: "2px solid #364182", outline: "none" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontWeight: 700, fontSize: "14px" }}>COMPANY SIZE</label>
                            <select
                                name="size"
                                value={formData.size}
                                onChange={handleChange}
                                style={{ padding: "12px 16px", borderRadius: "12px", border: "2px solid #364182", outline: "none", backgroundColor: "#fff" }}
                            >
                                <option value="1-10">1-10 employees</option>
                                <option value="11-50">11-50 employees</option>
                                <option value="51-200">51-200 employees</option>
                                <option value="201-500">201-500 employees</option>
                                <option value="500+">500+ employees</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontWeight: 700, fontSize: "14px" }}>DESCRIPTION</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Tell us about your organization and what you're looking for..."
                            rows={4}
                            style={{ padding: "12px 16px", borderRadius: "12px", border: "2px solid #364182", outline: "none", resize: "vertical" }}
                        />
                    </div>

                    <div style={{ marginTop: "20px", display: "flex", gap: "16px" }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: "16px",
                                borderRadius: "12px",
                                border: "none",
                                backgroundColor: "#6366f1",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "16px",
                                cursor: loading ? "not-allowed" : "pointer",
                                boxShadow: "0 4px 12px rgba(99,102,241,0.3)"
                            }}
                        >
                            {loading ? "SUBMITTING..." : "REGISTER ORGANIZATION"}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            style={{
                                padding: "16px 24px",
                                borderRadius: "12px",
                                border: "2px solid #364182",
                                backgroundColor: "transparent",
                                color: "#364182",
                                fontWeight: 700,
                                cursor: "pointer"
                            }}
                        >
                            CANCEL
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
