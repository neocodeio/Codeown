import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { X, MagnifyingGlass, PaperPlaneTilt } from "phosphor-react";
import AvailabilityBadge from "./AvailabilityBadge";
import { toast } from "react-toastify";

interface Partner {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
}

interface Conversation {
  id: number;
  partner: Partner;
}

interface SendToChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: number;
  projectId?: number;
  initialMessage?: string;
}

export default function SendToChatModal({ isOpen, onClose, postId, projectId, initialMessage }: SendToChatModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const { getToken } = useClerkAuth();

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await api.get("/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(res.data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (convoId: number) => {
    setSendingId(convoId);
    try {
      const token = await getToken();
      await api.post(
        "/messages",
        {
          conversationId: convoId,
          sharedPostId: postId,
          sharedProjectId: projectId,
          content: initialMessage || ""
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Shared successfully!");
      onClose();
    } catch (error) {
      console.error("Error sharing to chat:", error);
      toast.error("Failed to share");
    } finally {
      setSendingId(null);
    }
  };

  if (!isOpen) return null;

  const filtered = conversations.filter(c => 
    c.partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.partner.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 9999,
        backdropFilter: "blur(4px)"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "var(--bg-page)",
          borderRadius: "12px",
          border: "0.5px solid var(--border-hairline)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "80vh",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "20px", borderBottom: "0.5px solid var(--border-hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 800, fontFamily: "var(--font-mono)", textTransform: "uppercase", color: "var(--text-primary)" }}>
            Share to Chat
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}>
            <X size={20} weight="bold" />
          </button>
        </div>

        <div style={{ padding: "16px", borderBottom: "0.5px solid var(--border-hairline)" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <MagnifyingGlass size={18} weight="thin" style={{ position: "absolute", left: "12px", color: "var(--text-tertiary)" }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 12px 12px 40px",
                borderRadius: "8px",
                border: "0.5px solid var(--border-hairline)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "13px",
                outline: "none",
                fontFamily: "var(--font-mono)"
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
              LOADING CONVERSATIONS...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
              NO CONVERSATIONS FOUND
            </div>
          ) : (
            filtered.map((convo) => (
              <div
                key={convo.id}
                onClick={() => handleSend(convo.id)}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "background 0.2s ease"
                }}
                className="share-item-hover"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <AvailabilityBadge avatarUrl={convo.partner.avatar_url} name={convo.partner.name} size={36} />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{convo.partner.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>@{convo.partner.username}</div>
                  </div>
                </div>
                <button
                  disabled={sendingId === convo.id}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    backgroundColor: "var(--text-primary)",
                    color: "var(--bg-page)",
                    border: "none",
                    fontSize: "11px",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  {sendingId === convo.id ? "..." : <><PaperPlaneTilt size={14} weight="bold" /> SEND</>}
                </button>
              </div>
            ))
          )}
        </div>
        <style>{`.share-item-hover:hover { background-color: var(--bg-hover); }`}</style>
      </div>
    </div>,
    document.body
  );
}
