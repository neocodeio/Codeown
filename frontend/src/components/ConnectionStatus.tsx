import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Wifi01Icon,
    WifiOff01Icon,
} from "@hugeicons/core-free-icons";

export default function ConnectionStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showStatus, setShowStatus] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowStatus(true);

            // Hide the "Back Online" message after 3 seconds
            setTimeout(() => {
                setShowStatus(false);
            }, 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowStatus(true);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <div style={{ zIndex: 99999 }}>
            <style>{`
                @keyframes blurFadeIn {
                    from { backdrop-filter: blur(0px); background: rgba(255, 255, 255, 0); }
                    to { backdrop-filter: blur(12px); background: rgba(255, 255, 255, 0.7); }
                }

                @keyframes cardSlideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                @keyframes wifiPulse {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }

                @keyframes bannerSlideIn {
                    from { transform: translateX(-50%) translateY(100px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }

                .offline-full-screen {
                    position: fixed;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    animation: blurFadeIn 0.5s ease-out forwards;
                    z-index: 100000;
                    backdrop-filter: blur(12px);
                }

                .offline-premium-card {
                    background: white;
                    padding: 48px 40px;
                    border-radius: 40px;
                    box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.15);
                    max-width: 440px;
                    width: 100%;
                    border: 1px solid rgba(241, 245, 249, 1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 32px;
                    animation: cardSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .wifi-error-circle {
                    width: 96px;
                    height: 96px;
                    background: #fef2f2;
                    border-radius: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ef4444;
                    position: relative;
                    animation: wifiPulse 2s infinite;
                }

                .online-success-pill {
                    position: fixed;
                    bottom: 32px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 100000;
                    animation: bannerSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>

            {!isOnline && (
                <div className="offline-full-screen">
                    <div className="offline-premium-card">
                        <div className="wifi-error-circle">
                            <HugeiconsIcon icon={WifiOff01Icon} style={{ fontSize: "44px" }} />
                        </div>

                        <div>
                            <h2 style={{ fontSize: "32px", fontWeight: 900, color: "#0f172a", marginBottom: "16px", letterSpacing: "-0.04em" }}>
                                Connection Lost
                            </h2>
                            <p style={{ color: "#64748b", fontSize: "17px", lineHeight: "1.7", fontWeight: 500, margin: 0 }}>
                                It seems your internet connection is currently unstable. We'll automatically reconnect once you're back.
                            </p>
                        </div>

                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 24px",
                            background: "#f8fafc",
                            borderRadius: "16px",
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                        }}>
                            <div style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "#ef4444",
                                boxShadow: "0 0 10px rgba(239, 68, 68, 0.5)"
                            }} />
                            Searching for Signal...
                        </div>
                    </div>
                </div>
            )}

            {isOnline && showStatus && (
                <div className="online-success-pill">
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "14px 28px",
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "100px",
                        color: "#15803d",
                        boxShadow: "0 20px 40px rgba(21, 128, 61, 0.15)",
                    }}>
                        <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#dcfce7",
                        }}>
                            <HugeiconsIcon icon={Wifi01Icon} style={{ fontSize: "20px" }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 800, fontSize: "15px", letterSpacing: "-0.01em" }}>Back Online</span>
                            <span style={{ fontSize: "12px", opacity: 0.8, fontWeight: 500 }}>All systems are live again.</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
