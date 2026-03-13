import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useWindowSize } from "../hooks/useWindowSize";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SentIcon,
  Comment01Icon,
  ArrowLeft01Icon,
  MailEdit01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import NewMessageModal from "../components/NewMessageModal";
import VerifiedBadge from "../components/VerifiedBadge";
import { socket } from "../lib/socket";

interface Partner {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
}

interface Conversation {
  id: number;
  partner: Partner;
  last_message: Message | null;
  unread_count?: number;
}

export default function Messages() {
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("userId");
  const { getToken } = useClerkAuth();
  const { user: currentUser } = useClerkUser();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!currentUser?.id) return;

    socket.connect();
    socket.emit("join", currentUser.id);

    const handleTyping = ({ senderId }: { senderId: string }) => {
      setTypingUsers((prev) => ({ ...prev, [senderId]: true }));
      scrollToBottom();
    };

    const handleStopTyping = ({ senderId }: { senderId: string }) => {
      setTypingUsers((prev) => ({ ...prev, [senderId]: false }));
    };

    const handleMessagesRead = ({ conversationId, readerId }: { conversationId: number, readerId: string }) => {
      setMessages((prev) => prev.map(m => (m.conversation_id === conversationId && !m.is_read && m.sender_id !== readerId) ? { ...m, is_read: true } : m));
    };

    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("messages_read", handleMessagesRead);
      socket.disconnect();
    };
  }, [currentUser?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const token = await getToken();
      const res = await api.get("/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const convos = Array.isArray(res.data) ? res.data : [];
      setConversations(convos);

      if (targetUserId && !activeConvo) {
        const existing = convos.find((c: Conversation) => c.partner.id === targetUserId);
        if (existing) {
          setActiveConvo(existing);
        } else {
          await startPlaceholderConvo(targetUserId);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      if (targetUserId && !activeConvo) {
        await startPlaceholderConvo(targetUserId);
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const startPlaceholderConvo = async (userId: string) => {
    try {
      const token = await getToken();
      const res = await api.get(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data) {
        const placeholder: Conversation = {
          id: 0,
          partner: {
            id: res.data.id,
            name: res.data.name,
            username: res.data.username,
            avatar_url: res.data.avatar_url,
          },
          last_message: null,
        };
        setActiveConvo(placeholder);
        setIsNewMessageModalOpen(false);
      }
    } catch (error) {
      console.error("Error starting placeholder convo:", error);
    }
  };

  const fetchMessages = async (convoId: number, partnerId?: string) => {
    if (convoId === 0) {
      setMessages([]);
      return;
    }
    try {
      const token = await getToken();
      const res = await api.get(`/messages/${convoId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);

      if (currentUser?.id && partnerId) {
        socket.emit("mark_read", { senderId: currentUser.id, receiverId: partnerId, conversationId: convoId });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchConversations(true);
    // Poll for new conversations/messages every 10 seconds
    const interval = setInterval(() => fetchConversations(false), 10000);
    return () => clearInterval(interval);
  }, [targetUserId]);

  useEffect(() => {
    if (activeConvo && activeConvo.id !== 0) {
      fetchMessages(activeConvo.id, activeConvo.partner.id);
      const interval = setInterval(() => {
        fetchMessages(activeConvo.id, activeConvo.partner.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeConvo?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (activeConvo && activeConvo.partner.id && currentUser?.id) {
      socket.emit("stop_typing", { senderId: currentUser.id, receiverId: activeConvo.partner.id });
    }

    setSending(true);
    try {
      const token = await getToken();
      const res = await api.post(
        "/messages",
        {
          conversationId: activeConvo?.id === 0 ? undefined : activeConvo?.id,
          recipientId: activeConvo?.id === 0 ? activeConvo?.partner.id : undefined,
          content: newMessage.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNewMessage("");
      if (activeConvo?.id === 0) {
        await fetchConversations();
      } else {
        setMessages([...messages, res.data]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (activeConvo && activeConvo.partner.id && currentUser?.id) {
      socket.emit("typing", { senderId: currentUser.id, receiverId: activeConvo.partner.id });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { senderId: currentUser.id, receiverId: activeConvo.partner.id });
      }, 2000);
    }
  };

  const filteredConversations = conversations.filter(
    (convo) =>
      convo.partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (convo.partner.username &&
        convo.partner.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 80px)",
          padding: isMobile ? "24px" : "40px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #f1f5f9",
            borderTopColor: "#0f172a",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  const sidebarWidth = isMobile ? "100%" : isTablet ? "320px" : "380px";

  return (
    <main
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        height: isMobile ? "calc(100vh - 64px)" : "calc(100vh - 0px)",
        maxWidth: "1280px",
        margin: "0 auto",
        overflow: "hidden",
        backgroundColor: "#fff",
      }}
    >
      {/* Sidebar */}
      {(!isMobile || !activeConvo) && (
        <div
          style={{
            width: sidebarWidth,
            minWidth: isMobile ? undefined : "280px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: isMobile ? "none" : "1px solid #f1f5f9",
            height: "100%",
          }}
        >
          <div
            style={{
              padding: isMobile ? "20px 16px" : "24px 20px",
              borderBottom: "1px solid #f1f5f9",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h1
                style={{
                  fontSize: isMobile ? "22px" : "24px",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                  letterSpacing: "-0.03em",
                }}
              >
                Messages
              </h1>
              <button
                onClick={() => setIsNewMessageModalOpen(true)}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#fff",
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.borderColor = "#0f172a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <HugeiconsIcon icon={MailEdit01Icon} size={22} style={{ width: 22, height: 22 }} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                backgroundColor: "#f8fafc",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
              }}
            >
              <HugeiconsIcon
                icon={Search01Icon}
                size={20}
                style={{ color: "#94a3b8", flexShrink: 0 }}
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  background: "none",
                  flex: 1,
                  outline: "none",
                  fontSize: "15px",
                  color: "#0f172a",
                }}
              />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px",
            }}
          >
            {conversations.length === 0 && !targetUserId && (
              <div
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    backgroundColor: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <HugeiconsIcon
                    icon={MailEdit01Icon}
                    size={36}
                    style={{ color: "#94a3b8", opacity: 0.6 }}
                  />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: "#0f172a", margin: 0, fontSize: "16px" }}>
                    No conversations yet
                  </p>
                  <p style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
                    Start a conversation with someone from the community
                  </p>
                </div>
                <button
                  onClick={() => setIsNewMessageModalOpen(true)}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 700,
                    backgroundColor: "#0f172a",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1e293b";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#0f172a";
                  }}
                >
                  New message
                </button>
              </div>
            )}
            {filteredConversations.map((convo) => (
              <div
                key={convo.id}
                onClick={() => {
                  setActiveConvo(convo);
                  if (convo.unread_count && convo.unread_count > 0) {
                    setConversations(prev =>
                      prev.map(c => c.id === convo.id ? { ...c, unread_count: 0 } : c)
                    );
                  }
                }}
                style={{
                  padding: "14px 16px",
                  cursor: "pointer",
                  backgroundColor: activeConvo?.id === convo.id ? "#f8fafc" : "transparent",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  marginBottom: "4px",
                  border:
                    activeConvo?.id === convo.id
                      ? "1px solid #e2e8f0"
                      : "1px solid transparent",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (activeConvo?.id !== convo.id)
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  if (activeConvo?.id !== convo.id)
                    e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <img
                  src={
                    convo.partner.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(convo.partner.name)}&background=212121&color=fff&bold=true`
                  }
                  alt=""
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "15px",
                        color: "#0f172a",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {convo.partner.name}
                      <VerifiedBadge username={convo.partner.username} size="14px" />
                    </div>
                    {convo.last_message && (
                      <span style={{ fontSize: "12px", color: "#94a3b8", flexShrink: 0 }}>
                        {new Date(convo.last_message.created_at).toLocaleDateString() ===
                          new Date().toLocaleDateString()
                          ? new Date(convo.last_message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : new Date(convo.last_message.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: convo.unread_count && convo.unread_count > 0 ? "#0f172a" : (activeConvo?.id === convo.id ? "#475569" : "#64748b"),
                      fontWeight: convo.unread_count && convo.unread_count > 0 ? 700 : 400,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <div style={{ display: "flex", gap: "4px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {typingUsers[convo.partner.id] ? (
                        <span style={{ color: "#3b82f6", fontWeight: 700, fontStyle: "italic", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}>typing...</span>
                      ) : convo.last_message ? (
                        <>
                          {convo.last_message.sender_id === currentUser?.id && (
                            <span style={{ color: "#94a3b8", fontWeight: 600 }}>You:</span>
                          )}
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                            {convo.last_message.content}
                          </span>
                        </>
                      ) : (
                        "No messages yet"
                      )}
                    </div>
                    {convo.unread_count && convo.unread_count > 0 && (
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#3b82f6",
                        flexShrink: 0,
                        marginLeft: "8px"
                      }} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat area */}
      {(!isMobile || activeConvo) && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            height: "100%",
            backgroundColor: "#fafafa",
          }}
        >
          {activeConvo ? (
            <>
              {/* Header */}
              <div
                style={{
                  padding: isMobile ? "16px 20px" : "20px 24px",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  backgroundColor: "#fff",
                  flexShrink: 0,
                }}
              >
                {isMobile && (
                  <button
                    onClick={() => setActiveConvo(null)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "8px",
                      cursor: "pointer",
                      marginLeft: "-8px",
                      color: "#64748b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <HugeiconsIcon
                      icon={ArrowLeft01Icon}
                      size={24}
                      style={{ width: 24, height: 24 }}
                    />
                  </button>
                )}
                <img
                  src={
                    activeConvo.partner.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConvo.partner.name)}&background=212121&color=fff&bold=true`
                  }
                  alt=""
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                  onClick={() => navigate(`/user/${activeConvo.partner.id}`)}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "16px",
                      color: "#0f172a",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    onClick={() => navigate(`/user/${activeConvo.partner.id}`)}
                  >
                    {activeConvo.partner.name}
                    <VerifiedBadge username={activeConvo.partner.username} size="14px" />
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>
                    @{activeConvo.partner.username || "user"}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: isMobile ? "20px 16px" : "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {messages.length === 0 && activeConvo.id !== 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 24px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        backgroundColor: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <HugeiconsIcon
                        icon={Comment01Icon}
                        size={40}
                        style={{ color: "#94a3b8", opacity: 0.5 }}
                      />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: "#0f172a", margin: 0, fontSize: "16px" }}>
                        No messages yet
                      </p>
                      <p style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
                        Say hello and start the conversation
                      </p>
                    </div>
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const isMine = msg.sender_id === currentUser?.id;
                  return (
                    <div
                      key={msg.id || idx}
                      style={{
                        alignSelf: isMine ? "flex-end" : "flex-start",
                        maxWidth: isMobile ? "88%" : "70%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMine ? "flex-end" : "flex-start",
                        gap: "2px",
                      }}
                    >
                      {/* Name Label - Only show for received messages */}
                      {!isMine && (
                        <span style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "#64748b",
                          marginBottom: "2px",
                          padding: "0 4px"
                        }}>
                          {activeConvo.partner.name}
                        </span>
                      )}

                      <div
                        style={{
                          padding: "12px 16px",
                          borderRadius: isMine
                            ? "18px 18px 4px 18px"
                            : "18px 18px 18px 4px",
                          backgroundColor: isMine ? "#0f172a" : "#fff",
                          color: isMine ? "#fff" : "#0f172a",
                          fontSize: "15px",
                          lineHeight: 1.5,
                          boxShadow:
                            isMine
                              ? "0 2px 8px rgba(15, 23, 42, 0.12)"
                              : "0 2px 8px rgba(0,0,0,0.04)",
                          border: isMine ? "none" : "1px solid #e2e8f0",
                          wordBreak: "break-word"
                        }}
                      >
                        {msg.content}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 6px 0", alignSelf: isMine ? "flex-end" : "flex-start" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#94a3b8",
                            fontWeight: 500,
                          }}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMine && msg.is_read && (() => {
                          let lastMyMsgIdx = -1;
                          for (let i = messages.length - 1; i >= 0; i--) {
                            if (messages[i].sender_id === currentUser?.id) {
                              lastMyMsgIdx = i;
                              break;
                            }
                          }
                          return idx === lastMyMsgIdx;
                        })() && (
                          <span style={{ fontSize: "10px", color: "#3b82f6", fontWeight: 700, marginLeft: "2px" }}>Seen</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {activeConvo && typingUsers[activeConvo.partner.id] && (
                  <div
                    style={{
                      alignSelf: "flex-start",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "16px",
                      borderRadius: "18px 18px 18px 4px",
                      backgroundColor: "#fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      border: "1px solid #e2e8f0",
                      marginTop: "4px"
                    }}
                  >
                    {/* The animation frames are in the style tag below */}
                    <div style={{ backgroundColor: "#94a3b8", width: "6px", height: "6px", borderRadius: "50%", animation: "typing-bounce 1.4s infinite ease-in-out both", animationDelay: "-0.32s" }} />
                    <div style={{ backgroundColor: "#94a3b8", width: "6px", height: "6px", borderRadius: "50%", animation: "typing-bounce 1.4s infinite ease-in-out both", animationDelay: "-0.16s" }} />
                    <div style={{ backgroundColor: "#94a3b8", width: "6px", height: "6px", borderRadius: "50%", animation: "typing-bounce 1.4s infinite ease-in-out both" }} />
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div
                style={{
                  padding: isMobile ? "16px" : "20px 24px",
                  backgroundColor: "#fff",
                  borderTop: "1px solid #e2e8f0",
                  flexShrink: 0,
                }}
              >
                <form
                  onSubmit={handleSendMessage}
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e as unknown as React.FormEvent);
                      }
                    }}
                    placeholder="Type a message..."
                    style={{
                      flex: 1,
                      padding: isMobile ? "14px 18px" : "16px 20px",
                      borderRadius: "100px",
                      border: "1px solid #e2e8f0",
                      outline: "none",
                      backgroundColor: "#f8fafc",
                      fontSize: "15px",
                      color: "#0f172a",
                      transition: "all 0.2s",
                      minWidth: 0,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#0f172a";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15, 23, 42, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    style={{
                      width: isMobile ? "48px" : "52px",
                      height: isMobile ? "48px" : "52px",
                      borderRadius: "50%",
                      border: "none",
                      backgroundColor: newMessage.trim() ? "#0f172a" : "#e2e8f0",
                      color: newMessage.trim() ? "#fff" : "#94a3b8",
                      cursor: newMessage.trim() ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    <HugeiconsIcon
                      icon={SentIcon}
                      size={22}
                      style={{ width: 22, height: 22 }}
                    />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "20px",
                padding: "40px",
                textAlign: "center",
                backgroundColor: "#fafafa",
              }}
            >
              <div
                style={{
                  width: "96px",
                  height: "96px",
                  borderRadius: "50%",
                  backgroundColor: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HugeiconsIcon
                  icon={Comment01Icon}
                  size={48}
                  style={{ color: "#94a3b8", opacity: 0.5 }}
                />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Your messages
                </h3>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "15px",
                    color: "#64748b",
                    lineHeight: 1.5,
                    maxWidth: "280px",
                  }}
                >
                  Select a conversation from the list to start chatting.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <NewMessageModal
        isOpen={isNewMessageModalOpen}
        onClose={() => setIsNewMessageModalOpen(false)}
        onSelectUser={(user) => startPlaceholderConvo(user.id)}
      />

      <style>{`
        @keyframes typing-bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </main>
  );
}
