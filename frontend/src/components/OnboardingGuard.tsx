import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoaded, isSignedIn } = useClerkUser();
    const { getToken } = useClerkAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkOnboarding = async () => {
            if (!isLoaded) return;
            if (!isSignedIn) {
                setChecking(false);
                return;
            }

            // Skip check if already on onboarding page or auth pages
            if (
                location.pathname === "/onboarding" ||
                location.pathname.startsWith("/sign-in") ||
                location.pathname.startsWith("/sign-up")
            ) {
                setChecking(false);
                return;
            }

            try {
                const token = await getToken();
                const res = await api.get(`/users/${user?.id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });

                if (res.data && res.data.onboarding_completed === false) {
                    navigate("/onboarding");
                }
            } catch (error) {
                console.error("Error checking onboarding status:", error);
            } finally {
                setChecking(false);
            }
        };

        checkOnboarding();
    }, [isLoaded, isSignedIn, user?.id, navigate, location.pathname, getToken]);

    if (checking) {
        return null; // Or a loading spinner
    }

    return <>{children}</>;
}
