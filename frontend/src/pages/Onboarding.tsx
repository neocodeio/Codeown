import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";

export default function Onboarding() {
    const { user } = useClerkUser();
    const { getToken } = useClerkAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<"developer" | "organization" | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        location: "",
        size: "1-10",
        job_title: "",
        skills: "",
        website: "",
        domain_email: "",
        industry: "",
        description: ""
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({ ...prev, name: user.fullName || prev.name }));
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleComplete = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };

            // 1. Update Profile Information
            const profileData: any = {
                location: formData.location,
                onboarding_completed: true
            };

            if (role === "developer") {
                profileData.job_title = formData.job_title;
                profileData.skills = formData.skills.split(",").map(s => s.trim()).filter(s => s !== "");
                profileData.is_organization = false;
            } else {
                profileData.is_organization = true;
            }

            await api.put(`/users/${user?.id}`, profileData, { headers });

            // 2. If Organization, Register it too
            if (role === "organization") {
                await api.post("/organizations", {
                    name: formData.name,
                    website: formData.website,
                    domain_email: formData.domain_email,
                    location: formData.location,
                    size: formData.size,
                    industry: formData.industry,
                    description: formData.description
                }, { headers });
            }

            // 3. Mark Onboarding as truly complete in DB (optional since put updates it, but let's be explicit)
            await api.post("/users/onboarding/complete", {}, { headers });

            // 4. Redirect to Feed
            navigate("/");
            window.location.reload(); // Refresh to update all state
        } catch (err: any) {
            setError(err.response?.data?.error || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ width: "100%", maxWidth: "600px", backgroundColor: "white", borderRadius: "32px", padding: "40px", boxShadow: "0 20px 50px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>

                {step === 1 && (
                    <div style={{ textAlign: "center" }}>
                        <h1 style={{ fontSize: "32px", fontWeight: 900, marginBottom: "16px", color: "#0f172a" }}>Welcome to Codeown! 🚀</h1>
                        <p style={{ color: "#64748b", fontSize: "18px", marginBottom: "40px" }}>First things first, tell us who you are.</p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                            <button
                                onClick={() => { setRole("developer"); setStep(2); }}
                                style={{
                                    padding: "30px",
                                    borderRadius: "20px",
                                    border: "2px solid #e2e8f0",
                                    background: role === "developer" ? "#f1f5f9" : "white",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#6366f1"}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                            >
                                <div style={{ fontSize: "24px", marginBottom: "8px" }}>💻</div>
                                <div style={{ fontWeight: 800, fontSize: "18px", color: "#0f172a" }}>I'm a Developer</div>
                                <div style={{ color: "#64748b", fontSize: "14px" }}>Build projects, share code, and get hired.</div>
                            </button>

                            <button
                                onClick={() => { setRole("organization"); setStep(2); }}
                                style={{
                                    padding: "30px",
                                    borderRadius: "20px",
                                    border: "2px solid #e2e8f0",
                                    background: role === "organization" ? "#f1f5f9" : "white",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#6366f1"}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                            >
                                <div style={{ fontSize: "24px", marginBottom: "8px" }}>🏢</div>
                                <div style={{ fontWeight: 800, fontSize: "18px", color: "#0f172a" }}>I'm an Organization</div>
                                <div style={{ color: "#64748b", fontSize: "14px" }}>Search for talent and collaborator for projects.</div>
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#64748b", fontWeight: 700, cursor: "pointer", marginBottom: "20px" }}>← BACK</button>
                        <h2 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "30px", color: "#0f172a" }}>
                            {role === "developer" ? "Set up your profile" : "Tell us about your company"}
                        </h2>

                        {error && <div style={{ padding: "16px", backgroundColor: "#fee2e2", color: "#ef4444", borderRadius: "12px", marginBottom: "20px", fontWeight: 600 }}>{error}</div>}

                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
                                    {role === "developer" ? "LOCATION" : "COMPANY LOCATION"}
                                </label>
                                <input
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g. London, Remote"
                                    style={{ width: "100%", padding: "14px 20px", borderRadius: "12px", border: "2px solid #f1f5f9", outline: "none", boxSizing: "border-box" }}
                                />
                            </div>

                            {role === "organization" && (
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>COMPANY SIZE</label>
                                    <select
                                        name="size"
                                        value={formData.size}
                                        onChange={handleChange}
                                        style={{ width: "100%", padding: "14px 20px", borderRadius: "12px", border: "2px solid #f1f5f9", outline: "none", boxSizing: "border-box", backgroundColor: "white" }}
                                    >
                                        <option value="1-10">1-10 employees</option>
                                        <option value="11-50">11-50 employees</option>
                                        <option value="51-200">51-200 employees</option>
                                        <option value="201-500">201-500 employees</option>
                                        <option value="500+">500+ employees</option>
                                    </select>
                                </div>
                            )}

                            {role === "developer" ? (
                                <>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>JOB TITLE</label>
                                        <input
                                            name="job_title"
                                            value={formData.job_title}
                                            onChange={handleChange}
                                            placeholder="e.g. Frontend Engineer"
                                            style={{ width: "100%", padding: "14px 20px", borderRadius: "12px", border: "2px solid #f1f5f9", outline: "none", boxSizing: "border-box" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>SKILLS (Comma separated)</label>
                                        <input
                                            name="skills"
                                            value={formData.skills}
                                            onChange={handleChange}
                                            placeholder="React, TypeScript, Node.js..."
                                            style={{ width: "100%", padding: "14px 20px", borderRadius: "12px", border: "2px solid #f1f5f9", outline: "none", boxSizing: "border-box" }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>DOMAIN EMAIL</label>
                                            <input
                                                name="domain_email"
                                                value={formData.domain_email}
                                                onChange={handleChange}
                                                placeholder="hr@acme.com"
                                                style={{ width: "100%", padding: "14px 20px", borderRadius: "12px", border: "2px solid #f1f5f9", outline: "none", boxSizing: "border-box" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>INDUSTRY</label>
                                            <input
                                                name="industry"
                                                value={formData.industry}
                                                onChange={handleChange}
                                                placeholder="e.g. Tech, Finance"
                                                style={{ width: "100%", padding: "14px 20px", borderRadius: "12px", border: "2px solid #f1f5f9", outline: "none", boxSizing: "border-box" }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>WEBSITE</label>
                                        <input
                                            name="website"
                                            value={formData.website}
                                            onChange={handleChange}
                                            placeholder="https://acme.com"
                                            style={{ width: "100%", padding: "14px 20px", borderRadius: "12px", border: "2px solid #f1f5f9", outline: "none", boxSizing: "border-box" }}
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                onClick={handleComplete}
                                disabled={loading}
                                style={{
                                    marginTop: "20px",
                                    padding: "16px",
                                    borderRadius: "16px",
                                    border: "none",
                                    backgroundColor: "#0f172a",
                                    color: "white",
                                    fontWeight: 800,
                                    fontSize: "16px",
                                    cursor: loading ? "not-allowed" : "pointer"
                                }}
                            >
                                {loading ? "SAVING..." : "COMPLETE REGISTRATION"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
