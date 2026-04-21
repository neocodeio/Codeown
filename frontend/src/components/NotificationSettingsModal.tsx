import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Notification01Icon,
    Cancel01Icon,
    Mail01Icon,
    Tick02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "react-toastify";

interface NotificationSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
    const [platformEnabled, setPlatformEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => { document.body.style.overflow = "auto"; };
    }, [isOpen]);

    const handleSave = async () => {
        setIsSaving(true);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsSaving(false);
        toast.success("Notification preferences saved!");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
            animation: "fadeIn 0.2s ease-out",
        }}>
            <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .notification-modal {
          width: 100%;
          max-width: 440px;
          background-color: var(--bg-page);
          border-radius: 24px;
          border: 1px solid var(--border-hairline);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }
        .modal-header {
          padding: 24px 32px;
          border-bottom: 1px solid var(--border-hairline);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-body {
          padding: 32px;
          overflow-y: auto;
          flex: 1;
        }
        .modal-footer {
          padding: 0 32px 32px;
        }
        @media (max-width: 480px) {
          .notification-modal { border-radius: 32px 32px 0 0; position: fixed; bottom: 0; max-height: 80vh; }
          .modal-header { padding: 20px 24px; }
          .modal-body { padding: 24px; }
          .modal-footer { padding: 0 24px 24px; }
          h2 { fontSize: 18px !important; }
        }
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          cursor: pointer;
        }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute;
          inset: 0;
          background-color: var(--bg-hover);
          transition: .3s;
          border-radius: 24px;
          border: 1px solid var(--border-hairline);
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 2px;
          bottom: 2px;
          background-color: var(--text-tertiary);
          transition: .3s;
          border-radius: 50%;
        }
        input:checked + .slider { background-color: var(--text-primary); border-color: var(--text-primary); }
        input:checked + .slider:before { transform: translateX(20px); background-color: var(--bg-page); }
      `}</style>

            <div className="notification-modal">
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Notification Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-tertiary)", display: "flex", transition: "color 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}
                    >
                        <HugeiconsIcon icon={Cancel01Icon} size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                        {/* Platform Notifications */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flex: 1 }}>
                                <div style={{ marginTop: "2px", width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-hairline)", flexShrink: 0 }}>
                                    <HugeiconsIcon icon={Notification01Icon} size={20} color="var(--text-primary)" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Platform Notifications</h3>
                                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.5 }}>Direct alerts inside Codeown</p>
                                </div>
                            </div>
                            <label className="toggle-switch" style={{ flexShrink: 0, marginLeft: "12px" }}>
                                <input type="checkbox" checked={platformEnabled} onChange={() => setPlatformEnabled(!platformEnabled)} />
                                <span className="slider"></span>
                            </label>
                        </div>

                        {/* Email Notifications */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flex: 1 }}>
                                <div style={{ marginTop: "2px", width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-hairline)", flexShrink: 0 }}>
                                    <HugeiconsIcon icon={Mail01Icon} size={20} color="var(--text-primary)" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Email Notifications</h3>
                                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.5 }}>Get updates in your inbox</p>
                                </div>
                            </div>
                            <label className="toggle-switch" style={{ flexShrink: 0, marginLeft: "12px" }}>
                                <input type="checkbox" checked={emailEnabled} onChange={() => setEmailEnabled(!emailEnabled)} />
                                <span className="slider"></span>
                            </label>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            width: "100%",
                            padding: "16px",
                            borderRadius: "16px",
                            backgroundColor: "var(--text-primary)",
                            color: "var(--bg-page)",
                            border: "none",
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: isSaving ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            transition: "all 0.2s ease",
                            opacity: isSaving ? 0.7 : 1,
                        }}
                        onMouseEnter={e => { if (!isSaving) e.currentTarget.style.transform = "translateY(-2px)"; }}
                        onMouseLeave={e => { if (!isSaving) e.currentTarget.style.transform = "translateY(0)"; }}
                    >
                        {isSaving ? (
                            <div className="skeleton-pulse" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
                        ) : (
                            <HugeiconsIcon icon={Tick02Icon} size={18} />
                        )}
                        {isSaving ? "Saving..." : "Save Preferences"}
                    </button>
                </div>
            </div>
        </div>
    );
}
