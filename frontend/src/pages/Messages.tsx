import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useWindowSize } from "../hooks/useWindowSize";
import { 
  PaperPlaneTilt, 
  CaretLeft, 
  ChatTeardropText,   
  NotePencil, 
  MagnifyingGlass,
  Plus
} from "phosphor-react";
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
  const initialMessage = searchParams.get("message");
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

  useEffect(() => {
    if (initialMessage) {
      setNewMessage(initialMessage);
    }
  }, [initialMessage]);

  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!currentUser?.id) return;

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
    };
  }, [currentUser?.id]);

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
            width: "32px",
            height: "32px",
            border: "0.5px solid var(--border-hairline)",
            borderTopColor: "var(--text-primary)",
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
        maxWidth: "100%",
        margin: "0 auto",
        overflow: "hidden",
        backgroundColor: "var(--bg-page)",
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
            borderRight: isMobile ? "none" : "0.5px solid var(--border-hairline)",
            height: "100%",
            backgroundColor: "var(--bg-page)",
          }}
        >
          <div
            style={{
              padding: isMobile ? "20px 24px" : "28px 24px",
              borderBottom: "0.5px solid var(--border-hairline)",
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
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                  letterSpacing: "0.05em",
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  flex: 1,
                  minWidth: 0
                }}
              >
                MESSAGES
              </h1>
              <button
                onClick={() => setIsNewMessageModalOpen(true)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "2px",
                  border: "1px solid var(--text-primary)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                  padding: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-input)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px" }}>
                  <NotePencil size={22} weight="bold" />
                </div>
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                backgroundColor: "var(--bg-input)",
                borderRadius: "2px",
                border: "0.5px solid var(--border-hairline)",
              }}
            >
              <MagnifyingGlass
                size={16}
                weight="thin"
                style={{ color: "var(--text-tertiary)", flexShrink: 0 }}
              />
              <input
                type="text"
                placeholder="SEARCH..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  background: "none",
                  flex: 1,
                  outline: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-primary)",
                  textTransform: "uppercase"
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
                    width: "64px",
                    height: "64px",
                    borderRadius: "2px",
                    backgroundColor: "var(--bg-hover)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "0.5px solid var(--border-hairline)"
                  }}
                >
                  <NotePencil
                    size={24}
                    weight="thin"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0, fontSize: "14px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                    NO CONVERSATIONS
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "6px" }}>
                    Start a conversation with someone from the community.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewMessageModalOpen(true)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "2px",
                    fontSize: "12px",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    backgroundColor: "var(--text-primary)",
                    color: "var(--bg-page)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textTransform: "uppercase"
                  }}
                >
                  NEW MESSAGE
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
                  padding: "20px",
                  cursor: "pointer",
                  backgroundColor: activeConvo?.id === convo.id ? "var(--bg-hover)" : "transparent",
                  borderRadius: "2px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  borderBottom: "0.5px solid var(--border-hairline)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (activeConvo?.id !== convo.id)
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
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
                    width: "40px",
                    height: "40px",
                    borderRadius: "2px",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: "0.5px solid var(--border-hairline)"
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
                        fontWeight: 600,
                        fontSize: "14px",
                        color: "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {convo.partner.name}
                      <VerifiedBadge username={convo.partner.username} size="13px" />
                    </div>
                    {convo.last_message && (
                      <span style={{ fontSize: "10px", color: "var(--text-tertiary)", flexShrink: 0, fontFamily: "var(--font-mono)" }}>
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
                      fontSize: "13px",
                      color: convo.unread_count && convo.unread_count > 0 ? "var(--text-primary)" : "var(--text-secondary)",
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
                    <div style={{ display: "flex", gap: "6px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", alignItems: "center" }}>
                      {typingUsers[convo.partner.id] ? (
                        <span style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "10px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}>typing...</span>
                      ) : convo.last_message ? (
                        <>
                          {convo.last_message.sender_id === currentUser?.id && (
                            <span style={{ color: "var(--text-tertiary)", fontWeight: 700, fontSize: "11px", fontFamily: "var(--font-mono)" }}>YOU:</span>
                          )}
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                            {convo.last_message.content}
                          </span>
                        </>
                      ) : (
                        "No messages yet"
                      )}
                    </div>
                    {(convo.unread_count ?? 0) > 0 && (
                      <div style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "var(--text-primary)",
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
            backgroundColor: "var(--bg-page)",
          }}
        >
          {activeConvo ? (
            <>
              {/* Header */}
                <div
                style={{
                  padding: isMobile ? "20px" : "28px 24px",
                  borderBottom: "0.5px solid var(--border-hairline)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  backgroundColor: "var(--bg-page)",
                  flexShrink: 0,
                }}
              >
                {isMobile && (
                  <button
                    onClick={() => setActiveConvo(null)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "4px",
                      cursor: "pointer",
                      marginLeft: "-4px",
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CaretLeft
                      size={20}
                      weight="thin"
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
                    width: "36px",
                    height: "36px",
                    borderRadius: "2px",
                    cursor: "pointer",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: "0.5px solid var(--border-hairline)"
                  }}
                  onClick={() => navigate(`/user/${activeConvo.partner.id}`)}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.05em"
                    }}
                    onClick={() => navigate(`/user/${activeConvo.partner.id}`)}
                  >
                    {activeConvo.partner.name.toUpperCase()}
                    <VerifiedBadge username={activeConvo.partner.username} size="14px" />
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                    @{activeConvo.partner.username || "user"}
                  </div>
                </div>

                {/* New Message button in Header for ease of use */}
                <button
                  onClick={() => setIsNewMessageModalOpen(true)}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "2px",
                    border: "0.5px solid var(--border-hairline)",
                    backgroundColor: "transparent",
                    color: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                >
                  <Plus size={18} weight="bold" />
                </button>
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
                        width: "64px",
                        height: "64px",
                        borderRadius: "2px",
                        backgroundColor: "var(--bg-hover)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "0.5px solid var(--border-hairline)"
                      }}
                    >
                      <ChatTeardropText
                        size={24}
                        weight="thin"
                        style={{ color: "var(--text-tertiary)" }}
                      />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0, fontSize: "12px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                        NO MESSAGES
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "6px" }}>
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
                          color: "var(--text-secondary)",
                          marginBottom: "4px",
                          padding: "0 4px",
                          fontFamily: "var(--font-mono)"
                        }}>
                          {activeConvo.partner.name}
                        </span>
                      )}

                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: "2px",
                          backgroundColor: isMine ? "var(--text-primary)" : "var(--bg-page)",
                          color: isMine ? "var(--bg-page)" : "var(--text-primary)",
                          fontSize: "14px",
                          lineHeight: 1.5,
                          border: "0.5px solid var(--border-hairline)",
                          wordBreak: "break-word"
                        }}
                      >
                        {(() => {
                           const urlRegex = /(https?:\/\/[^\s]+)/g;
                           const parts = msg.content.split(urlRegex);
                           return parts.map((part, i) => {
                             if (part.match(urlRegex)) {
                               return (
                                 <a
                                   key={i}
                                   href={part}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   style={{
                                     color: isMine ? "inherit" : "var(--text-primary)",
                                     textDecoration: "underline",
                                     fontWeight: 700,
                                     cursor: "pointer"
                                   }}
                                 >
                                   {part}
                                 </a>
                               );
                             }
                             return part;
                           });
                        })()}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 6px 0", alignSelf: isMine ? "flex-end" : "flex-start" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            color: "var(--text-tertiary)",
                            fontWeight: 500,
                            fontFamily: "var(--font-mono)"
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
                          <span style={{ fontSize: "10px", color: "var(--text-primary)", fontWeight: 700, marginLeft: "4px", fontFamily: "var(--font-mono)" }}>SEEN</span>
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
                          gap: "8px",
                          padding: "12px 16px",
                          borderRadius: "2px",
                          backgroundColor: "var(--bg-hover)",
                          border: "0.5px solid var(--border-hairline)",
                          marginTop: "4px"
                        }}
                      >
                    <div style={{ backgroundColor: "var(--text-primary)", width: "6px", height: "6px", borderRadius: "2px", animation: "typing-bounce 1.4s infinite ease-in-out both", animationDelay: "-0.32s" }} />
                    <div style={{ backgroundColor: "var(--text-primary)", width: "6px", height: "6px", borderRadius: "2px", animation: "typing-bounce 1.4s infinite ease-in-out both", animationDelay: "-0.16s" }} />
                    <div style={{ backgroundColor: "var(--text-primary)", width: "6px", height: "6px", borderRadius: "2px", animation: "typing-bounce 1.4s infinite ease-in-out both" }} />
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div
                style={{
                  padding: isMobile ? "12px 16px" : "16px 24px",
                  backgroundColor: "var(--bg-page)",
                  borderTop: "0.5px solid var(--border-hairline)",
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
                      padding: "12px 16px",
                      borderRadius: "2px",
                      border: "0.5px solid var(--border-hairline)",
                      outline: "none",
                      backgroundColor: "var(--bg-input)",
                      fontSize: "14px",
                      color: "var(--text-primary)",
                      transition: "all 0.15s ease",
                      minWidth: 0,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--text-primary)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-hairline)";
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "2px",
                      border: "0.5px solid var(--border-hairline)",
                      backgroundColor: newMessage.trim() ? "var(--text-primary)" : "transparent",
                      color: newMessage.trim() ? "var(--bg-page)" : "var(--text-tertiary)",
                      cursor: newMessage.trim() ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                  >
                    <PaperPlaneTilt
                      size={20}
                      weight="thin"
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
                gap: "24px",
                padding: "40px",
                textAlign: "center",
                backgroundColor: "var(--bg-page)",
              }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "2px",
                  backgroundColor: "var(--bg-hover)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "0.5px solid var(--border-hairline)"
                }}
              >
                <ChatTeardropText
                  size={32}
                  weight="thin"
                  style={{ color: "var(--text-tertiary)" }}
                />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                    letterSpacing: "0.05em",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase"
                  }}
                >
                  YOUR MESSAGES
                </h3>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "13px",
                    color: "var(--text-tertiary)",
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
