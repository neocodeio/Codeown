import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { useClerkUser } from "../hooks/useClerkUser";
import { useState, useEffect } from "react";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";

interface ProUpgradeCTAProps {
    style?: React.CSSProperties;
    compact?: boolean;
}

export default function ProUpgradeCTA({ style, compact }: ProUpgradeCTAProps) {
    const { isSignedIn, user } = useClerkUser();
    const { getToken } = useClerkAuth();
    const [isPro, setIsPro] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkPro = async () => {
            if (isSignedIn && user?.id) {
                try {
                    const token = await getToken();
                    const res = await api.get(`/users/${user.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setIsPro(res.data.is_pro === true);
                } catch (err) {
                    console.error("CTA pro check failed", err);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        checkPro();
    }, [isSignedIn, user?.id, getToken]);

    if (!isSignedIn || isPro || loading) return null;

    return (
        <div style={{
            padding: compact ? "16px" : "20px",
            borderRadius: compact ? "0" : "16px",
            background: "#fff",
            color: "#000",
            position: "relative",
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            transition: "all 0.3s ease",
            ...style
        }}>
            <div style={{ position: "relative", zIndex: 1 }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: compact ? "15px" : "16px", fontWeight: 800, color: "#000", letterSpacing: "-0.01em" }}>
                    Upgrade to Pro
                </h3>
                <p style={{ margin: "0 0 16px 0", fontSize: compact ? "13px" : "14px", color: "#64748b", lineHeight: "1.5", fontWeight: 500 }}>
                    Unlock exclusive features, get the golden badge, and explore your personalized analytics.
                </p>
                <Link to="/billing" style={{ textDecoration: "none" }}>
                    <button style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "10px 16px",
                        backgroundColor: "#000",
                        color: "#fff",
                        border: "none",
                        borderRadius: "100px",
                        fontSize: "14px",
                        fontWeight: 700,
                        cursor: "pointer",
                        width: compact ? "100%" : "auto"
                    }}>
                        Upgrade Now
                        <HugeiconsIcon icon={ArrowRight01Icon} style={{ width: "16px", height: "16px" }} />
                    </button>
                </Link>
            </div>
        </div>
    );
}
