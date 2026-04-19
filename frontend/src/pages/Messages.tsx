import { useState, useEffect, useRef, memo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useWindowSize } from "../hooks/useWindowSize";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SentIcon,
  ArrowLeft01Icon,
  Chat01Icon,
  MessageAdd01Icon,
  Search01Icon,
  Image01Icon,
  UserIcon,
  Cancel01Icon,
  ReloadIcon,
  Delete02Icon,
  MoreHorizontalIcon,
  Mic01Icon,
  Square01Icon,
  GifIcon,
  InformationCircleIcon,
  TickDouble02Icon,
  PlayIcon,
  PauseIcon,
  CopyIcon
} from "@hugeicons/core-free-icons";
import { toast } from "react-toastify";
import NewMessageModal from "../components/NewMessageModal";
import GifPicker from "../components/GifPicker";
import VerifiedBadge from "../components/VerifiedBadge";
import AvailabilityBadge from "../components/AvailabilityBadge";
import { socket } from "../lib/socket";
import { useActivityBroadcast } from "../hooks/useActivityBroadcast";
import { SEO } from "../components/SEO";
import alertSound from "../assets/notification-alert.mp3";
import { useNotifications } from "../hooks/useNotifications";
import { formatMessageTimestamp } from "../utils/date";

interface Partner {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  is_og?: boolean;
}

interface Message {
  id: number | string;
  conversation_id: number | string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
  status?: 'sent' | 'sending' | 'error';
  tempId?: string;
  image_url?: string;
  audio_url?: string;
  reply_to?: {
    id: number | string;
    content: string;
    sender_id: string;
    image_url?: string;
    audio_url?: string;
  };
  reactions?: { [emoji: string]: string[] };
  shared_post_id?: number | string;
  shared_project_id?: number | string;
  shared_post?: {
    id: number | string;
    title: string;
    content: string;
    images: string[];
    user: {
      name: string;
      username: string;
      avatar_url: string;
    };
  };
  shared_project?: {
    id: number | string;
    title: string;
    description: string;
    cover_image: string;
    user: {
      name: string;
      username: string;
      avatar_url: string;
    };
  };
}

interface Conversation {
  id: number | string;
  partner: Partner;
  last_message: Message | null;
  unread_count?: number;
}

const CHAT_WAVE_BARS = Array.from({ length: 45 }).map(() => Math.random() * 0.7 + 0.3);

function VoiceWaveform({ url, isMine }: { url: string, isMine: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const animationRef = useRef<number | null>(null);
  const drawRef = useRef<() => void>(() => { });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const style = window.getComputedStyle(canvas);
    const primaryColor = style.color || (isMine ? "rgba(255,255,255,1)" : "#000");
    const secondaryColor = isMine ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)";

    const progress = duration > 0 ? currentTime / duration : 0;
    const time = (audioRef.current?.currentTime || 0) * 5;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = 2.5;
    const gap = 1.5;
    const totalWidth = CHAT_WAVE_BARS.length * (barWidth + gap);
    canvas.width = totalWidth;
    canvas.height = 36;

    CHAT_WAVE_BARS.forEach((heightMultiplier, i) => {
      const x = i * (barWidth + gap);
      let h = heightMultiplier * canvas.height * 0.8;
      if (isPlaying) {
        h += Math.sin(time + i * 0.5) * 4;
      }

      const y = (canvas.height - h) / 2;
      const isPast = i / CHAT_WAVE_BARS.length <= progress;

      ctx.fillStyle = isPast ? primaryColor : secondaryColor;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, h, 2);
      ctx.fill();
    });

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(drawRef.current);
    }
  }, [duration, currentTime, isMine, isPlaying]);

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    draw();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [draw]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "4px 0" }}>
      <button
        onClick={togglePlay}
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          backgroundColor: isMine ? "rgba(255,255,255,0.98)" : "var(--bg-hover)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: isMine ? "#000" : "var(--text-primary)",
          flexShrink: 0,
          transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        }}
      >
        {isPlaying ? <HugeiconsIcon icon={PauseIcon} size={22} /> : <HugeiconsIcon icon={PlayIcon} size={22} style={{ marginLeft: isPlaying ? 0 : "2px" }} />}
      </button>
      <canvas ref={canvasRef} style={{ height: "36px", flex: 1, maxWidth: "180px", cursor: "pointer" }} />
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
        style={{ display: "none" }}
      />
      <span style={{ fontSize: "11px", fontWeight: 700, opacity: 0.8, minWidth: "35px", textAlign: "right", fontFamily: "monospace" }}>
        {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
      </span>
    </div>
  );
}

const ConversationItem = memo(({
  convo,
  isActive,
  typingUsers,
  currentUser,
  convoMenuId,
  setConvoMenuId,
  deletingConvoId,
  onSelect,
  onProfile,
  onDelete
}: {
  convo: Conversation,
  isActive: boolean,
  typingUsers: Record<string, boolean>,
  currentUser: any,
  convoMenuId: number | string | null,
  setConvoMenuId: (id: number | string | null) => void,
  deletingConvoId: number | string | null,
  onSelect: (c: Conversation) => void,
  onProfile: (c: Conversation) => void,
  onDelete: (cId: number | string) => void
}) => {
  return (
    <div
      className="convo-container"
      onClick={() => onSelect(convo)}
      style={{
        padding: "16px 20px",
        cursor: "pointer",
        backgroundColor: isActive ? "var(--bg-hover)" : "transparent",
        transition: "all 0.2s cubic-bezier(0.19, 1, 0.22, 1)",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        position: "relative",
        borderRadius: "var(--radius-sm)",
        margin: "2px 8px",
        border: isActive ? "0.5px solid var(--border-hairline)" : "0.5px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <AvailabilityBadge
        avatarUrl={convo.partner.avatar_url}
        name={convo.partner.name}
        size={46}
        isOG={convo.partner.is_og}
        username={convo.partner.username}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0 }}>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {convo.partner.name}
              <VerifiedBadge username={convo.partner.username} size="14px" />
            </span>
          </div>
          <div style={{ position: "relative" }}>
            <span className="convo-timestamp-label" style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 500, opacity: convoMenuId === convo.id ? 0 : 1, transition: "opacity 0.2s ease" }}>
              {convo.last_message ? formatMessageTimestamp(convo.last_message.created_at) : ""}
            </span>
            <div
              className={`convo-dots-container ${convoMenuId === convo.id ? 'is-open' : ''}`}
              style={{
                position: "absolute",
                right: "-8px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                transition: "opacity 0.2s ease"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConvoMenuId(convoMenuId === convo.id ? null : convo.id);
                }}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "var(--bg-hover)",
                  border: "none",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                }}
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} size={22} />
              </button>
              {convoMenuId === convo.id && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "8px",
                  backgroundColor: "var(--bg-elevated)",
                  borderRadius: "14px",
                  padding: "6px",
                  minWidth: "160px",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                  border: "0.5px solid var(--border-hairline)",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px"
                }}>
                  <button onClick={() => onProfile(convo)} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px", border: "none", backgroundColor: "transparent", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}><HugeiconsIcon icon={UserIcon} size={18} /> Profile</button>
                  <button onClick={() => onDelete(convo.id)} disabled={deletingConvoId === convo.id} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px", border: "none", backgroundColor: "transparent", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: "#ff4444" }}><HugeiconsIcon icon={Delete02Icon} size={18} /> Delete chat</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ fontSize: "13px", color: convo.unread_count && convo.unread_count > 0 ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: convo.unread_count && convo.unread_count > 0 ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "4px" }}>
          <div style={{ display: "flex", gap: "6px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", alignItems: "center" }}>
            {typingUsers[convo.partner.id] ? <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>Typing...</span> : convo.last_message ? <span>{convo.last_message.sender_id === currentUser?.id && <span style={{ color: "var(--text-tertiary)", fontWeight: 600 }}>You: </span>}{convo.last_message.content || "Media"}</span> : "No messages"}
          </div>
          {(convo.unread_count ?? 0) > 0 && <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--text-primary)", flexShrink: 0 }} />}
        </div>
      </div>
    </div>
  );
});

const MessageBubble = memo(({
  msg,
  isMine,
  showSender,
  isLastInGroup,
  activeConvo,
  currentUser,
  messageMenuId,
  setMessageMenuId,
  deletingMessageId,
  setDeletingMessageId,
  onDelete,
  onReply,
  onReaction,
  onPreviewImage,
  reactingTo,
  setReactingTo,
  onNavigatePost,
  onNavigateProject
}: {
  msg: Message,
  isMine: boolean,
  activeConvo: Conversation,
  currentUser: any,
  messageMenuId: number | string | null,
  setMessageMenuId: (id: number | string | null) => void,
  deletingMessageId: number | string | null,
  setDeletingMessageId: (id: number | string | null) => void,
  onDelete: (id: number | string) => void,
  onReply: (m: Message) => void,
  onReaction: (id: number | string, e: string) => void,
  onPreviewImage: (url: string) => void,
  reactingTo: number | string | null,
  setReactingTo: (id: number | string | null) => void,
  onNavigatePost: (id: number | string) => void,
  onNavigateProject: (id: number | string) => void,
  showSender: boolean,
  isLastInGroup: boolean
}) => {
  return (
    <div className="message-row" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: isMine ? "flex-end" : "flex-start",
      gap: "2px",
      width: "100%",
      position: "relative",
      marginBottom: isLastInGroup ? "12px" : "2px"
    }}>
      {showSender && !isMine && (
        <span style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "6px",
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          {activeConvo.partner.name}
          <VerifiedBadge username={activeConvo.partner.username} size="12px" />
        </span>
      )}

      {msg.reply_to && (
        <div
          style={{
            padding: "8px 14px",
            backgroundColor: "var(--bg-hover)",
            borderLeft: "3px solid var(--text-tertiary)",
            borderRadius: "12px",
            fontSize: "12px",
            color: "var(--text-secondary)",
            marginBottom: "4px",
            maxWidth: "85%",
            cursor: "pointer",
            opacity: 0.9,
            margin: isMine ? "0 0 4px auto" : "0 auto 4px 0"
          }}
          onClick={() => document.getElementById(`msg-${msg.reply_to?.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
        >
          <div style={{ fontWeight: 800, fontSize: "11px", marginBottom: "2px", color: "var(--text-primary)" }}>
            {msg.reply_to.sender_id === currentUser?.id ? "You" : activeConvo.partner.name}
          </div>
          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {msg.reply_to.content || "Media"}
          </div>
        </div>
      )}

      <div style={{
        display: "flex",
        flexDirection: isMine ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: "8px",
        maxWidth: "85%",
      }}>
        <div style={{ position: "relative" }}>
          <motion.div
            id={`msg-${msg.id}`}
            onContextMenu={(e) => { e.preventDefault(); setReactingTo(msg.id); }}
            style={{
              padding: "10px 16px",
              borderRadius: isMine
                ? "20px 20px 4px 20px"
                : "20px 20px 20px 4px",
              backgroundColor: isMine ? "var(--text-primary)" : "var(--bg-hover)",
              color: isMine ? "var(--bg-page)" : "var(--text-primary)",
              fontSize: "14.5px",
              lineHeight: 1.55,
              border: isMine ? "none" : "1px solid var(--border-hairline)",
              wordBreak: "break-word",
              boxShadow: isMine ? "0 4px 15px rgba(0,0,0,0.1)" : "none",
              cursor: "pointer",
              userSelect: "none",
              position: "relative"
            }}
            onDoubleClick={(e) => { e.stopPropagation(); onReaction(msg.id, "❤️"); }}
          >
            {msg.image_url && (
              <img
                src={msg.image_url}
                alt=""
                style={{
                  maxWidth: "100%",
                  maxHeight: "350px",
                  borderRadius: "12px",
                  marginBottom: msg.content ? "10px" : 0,
                  display: "block",
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
                }}
                onClick={() => onPreviewImage(msg.image_url!)}
              />
            )}
            {msg.audio_url && <div style={{ marginTop: msg.image_url ? "10px" : 0 }}><VoiceWaveform url={msg.audio_url} isMine={isMine} /></div>}
            {msg.content && <div>{msg.content}</div>}

            {/* Shared Previews */}
            {msg.shared_post && (
              <div onClick={(e) => { e.stopPropagation(); onNavigatePost(msg.shared_post!.id); }} style={{ marginTop: msg.content ? "12px" : 4, backgroundColor: isMine ? "rgba(255,255,255,0.1)" : "var(--bg-page)", borderRadius: "12px", border: "1px solid var(--border-hairline)", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s" }}>
                {msg.shared_post.images && msg.shared_post.images[0] && <img src={msg.shared_post.images[0]} style={{ width: "100%", height: "120px", objectFit: "cover" }} />}
                <div style={{ padding: "10px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: isMine ? "rgba(255,255,255,0.7)" : "var(--text-tertiary)", marginBottom: "4px" }}>Shared Post • {msg.shared_post.user?.name}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>{msg.shared_post.title}</div>
                </div>
              </div>
            )}
            {msg.shared_project && (
              <div onClick={(e) => { e.stopPropagation(); onNavigateProject(msg.shared_project!.id); }} style={{ marginTop: msg.content ? "12px" : 4, backgroundColor: isMine ? "rgba(255,255,255,0.1)" : "var(--bg-page)", borderRadius: "12px", border: "1px solid var(--border-hairline)", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s" }}>
                {msg.shared_project.cover_image && <img src={msg.shared_project.cover_image} style={{ width: "100%", height: "120px", objectFit: "cover" }} />}
                <div style={{ padding: "10px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: isMine ? "rgba(255,255,255,0.7)" : "var(--text-tertiary)", marginBottom: "4px" }}>Shared Project • {msg.shared_project.user?.name}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>{msg.shared_project.title}</div>
                </div>
              </div>
            )}

            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
              <div style={{
                position: "absolute",
                bottom: "-14px",
                [isMine ? "left" : "right"]: "8px",
                display: "flex",
                flexWrap: "wrap",
                gap: "2px",
                zIndex: 2
              }}>
                {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                  const hasReacted = currentUser?.id && userIds.includes(currentUser.id);
                  return (
                    <div
                      key={emoji}
                      onClick={() => onReaction(msg.id, emoji)}
                      style={{
                        padding: "2px 6px",
                        backgroundColor: hasReacted ? "var(--text-primary)" : "var(--bg-page)",
                        color: hasReacted ? "var(--bg-page)" : "var(--text-primary)",
                        borderRadius: "10px",
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        cursor: "pointer",
                        border: "1px solid var(--border-hairline)",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                      }}
                    >
                      <span>{emoji}</span>
                      <span style={{ fontSize: "10px", fontWeight: 800 }}>{userIds.length}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        <div className="msg-actions" style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isMine ? "flex-end" : "flex-start",
          opacity: messageMenuId === msg.id ? 1 : 0,
          transition: "opacity 0.2s",
          paddingBottom: "4px"
        }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setMessageMenuId(messageMenuId === msg.id ? null : msg.id); }}
              style={{ background: "none", border: "none", padding: "4px", cursor: "pointer", color: "var(--text-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} size={20} />
            </button>
            {messageMenuId === msg.id && (
              <div style={{
                position: "absolute",
                top: "100%",
                [isMine ? "right" : "left"]: 0,
                marginTop: "8px",
                backgroundColor: "var(--bg-page)",
                border: "1px solid var(--border-hairline)",
                borderRadius: "12px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                zIndex: 1000,
                minWidth: "170px",
                overflow: "hidden"
              }}>
                {msg.content && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(msg.content);
                      toast.success("Copied to clipboard", {
                        position: "bottom-center",
                        autoClose: 1500,
                        hideProgressBar: true,
                        style: { backgroundColor: "var(--bg-page)", color: "var(--text-primary)", border: "1px solid var(--border-hairline)", borderRadius: "12px", fontSize: "13px", fontWeight: 600 }
                      });
                      setMessageMenuId(null);
                    }}
                    style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}
                  >
                    <HugeiconsIcon icon={CopyIcon} size={16} /> Copy text
                  </button>
                )}
                <button onClick={() => { onReply(msg); setMessageMenuId(null); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  <HugeiconsIcon icon={SentIcon} size={16} /> Reply
                </button>
                {isMine && (
                  <>
                    <div style={{ height: "1px", backgroundColor: "var(--border-hairline)", margin: "4px 0" }} />
                    {deletingMessageId === msg.id ? (
                      <div style={{ padding: "12px 16px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>Delete for everyone?</div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={(e) => { e.stopPropagation(); setDeletingMessageId(null); }} style={{ flex: 1, padding: "8px", border: "1px solid var(--border-hairline)", borderRadius: "8px", background: "transparent", color: "var(--text-primary)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>No</button>
                          <button onClick={(e) => { e.stopPropagation(); onDelete(msg.id); }} style={{ flex: 1, padding: "8px", border: "none", borderRadius: "8px", backgroundColor: "#ef4444", color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Yes</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setDeletingMessageId(msg.id); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#ef4444" }}>
                        <HugeiconsIcon icon={Delete02Icon} size={16} /> Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "2px 4px 0",
        alignSelf: isMine ? "flex-end" : "flex-start",
        marginRight: isMine ? "8px" : 0,
        marginLeft: isMine ? 0 : "8px"
      }}>
        <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 600, opacity: isLastInGroup ? 1 : 0.6 }}>
          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        {isMine && isLastInGroup && (
          msg.status === 'sending' ? (
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", border: "1.5px solid var(--text-tertiary)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
          ) : msg.status === 'error' ? (
            <HugeiconsIcon icon={InformationCircleIcon} size={12} color="#ef4444" />
          ) : msg.is_read ? (
            <HugeiconsIcon icon={TickDouble02Icon} size={14} color="#3B82F6" />
          ) : (
            <HugeiconsIcon icon={TickDouble02Icon} size={14} color="var(--text-tertiary)" />
          )
        )}
      </div>

      {reactingTo === msg.id && (
        <div style={{ position: "absolute", top: "100%", [isMine ? "right" : "left"]: 0, backgroundColor: "#F6F8F8", borderRadius: "30px", padding: "8px 16px", border: "1px solid var(--border-hairline)", display: "flex", gap: "12px", zIndex: 1000, marginTop: "12px" }}>
          {["👍", "❤️", "😂", "😮", "😢", "🔥"].map((emoji) => (
            <button key={emoji} onClick={() => onReaction(msg.id, emoji)} style={{ background: "none", border: "none", fontSize: "22px", padding: "4px", cursor: "pointer", transition: "transform 0.1s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>{emoji}</button>
          ))}
        </div>
      )}

      <style>{`
        .message-row:hover .msg-actions { opacity: 1 !important; }
        .message-action-menu { pointer-events: auto !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
});

export default function Messages() {
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("userId");
  const initialMessage = searchParams.get("message");
  const { getToken } = useClerkAuth();
  const { user: currentUser } = useClerkUser();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 1024;
  const isTablet = width >= 1024 && width < 1280;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [reactingTo, setReactingTo] = useState<number | string | null>(null);
  const [sending, setSending] = useState(false);
  const { announce } = useActivityBroadcast();
  const { clearMessageNotifications } = useNotifications();

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const queryClient = useQueryClient();

  const startPlaceholderConvo = useCallback(async (userId: string) => {
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
  }, [getToken]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 150;
      setIsAtBottom(atBottom);
    }
  };

  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: force ? "auto" : "smooth" });
    }
  }, [isAtBottom]);

  // Conversations Query
  const { data: qConversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get("/messages", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 30000,
  });

  // Messages Query
  const { data: qMessages = [], isLoading: qMessagesLoading } = useQuery({
    queryKey: ['messages', activeConvo?.id],
    queryFn: async () => {
      if (!activeConvo || activeConvo.id === 0) return [];
      const token = await getToken();
      const res = await api.get(`/messages/${activeConvo.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!activeConvo && activeConvo.id !== 0,
  });

  const hasAttemptedRef = useRef(false);

  // Reset attempt flag when target user changes
  useEffect(() => {
    hasAttemptedRef.current = false;
  }, [targetUserId]);

  useEffect(() => {
    if (qConversations && qConversations.length > 0) {
      // Only update if the length or first item changed to avoid loops
      if (conversations.length !== qConversations.length ||
        (conversations[0]?.id !== qConversations[0]?.id)) {
        setConversations(qConversations);
      }

      // Auto-select conversation from URL
      if (targetUserId && !activeConvo && !hasAttemptedRef.current) {
        const existing = qConversations.find((c: Conversation) => String(c.partner.id) === String(targetUserId));
        if (existing) {
          setActiveConvo(existing);
          clearMessageNotifications(String(existing.partner.id));
        } else {
          hasAttemptedRef.current = true;
          startPlaceholderConvo(targetUserId);
        }
      }
    }
  }, [qConversations, targetUserId, activeConvo, startPlaceholderConvo]);

  useEffect(() => {
    // When switching conversations, we should clear the current messages
    // to avoid showing stale data from the previous chat.
    if (activeConvo) {
      const cached = localStorage.getItem(`codeown_msgs_${activeConvo.id}`);
      if (cached) {
        setMessages(JSON.parse(cached));
      } else {
        setMessages([]);
      }
      setTimeout(() => scrollToBottom(true), 50);
    } else {
      setMessages([]);
    }
  }, [activeConvo?.id]);

  useEffect(() => {
    // Update local messages when the background query finishes
    // Added guards to prevent infinite loops
    if (!qMessagesLoading && qMessages) {
      const hasChanged = qMessages.length !== messages.filter(m => m.status !== 'sending').length ||
        (qMessages.length > 0 && messages.length > 0 && qMessages[0].id !== messages[0].id);

      if (hasChanged) {
        setMessages(qMessages);
        setTimeout(() => scrollToBottom(false), 50);
      }
    }
  }, [qMessages, qMessagesLoading]);

  useEffect(() => {
    if (initialMessage) {
      setNewMessage(initialMessage);
    }
  }, [initialMessage]);

  // LOCAL PERSISTENCE: Load from cache on mount
  useEffect(() => {
    if (!currentUser?.id) return;
    const cachedConvos = localStorage.getItem(`codeown_cached_convos_${currentUser.id}`);
    if (cachedConvos && conversations.length === 0) {
      setConversations(JSON.parse(cachedConvos));
    }
  }, [currentUser?.id]);

  // Save convos to cache when they change
  useEffect(() => {
    if (currentUser?.id && conversations.length > 0) {
      localStorage.setItem(`codeown_cached_convos_${currentUser.id}`, JSON.stringify(conversations.slice(0, 50)));
    }
  }, [conversations, currentUser?.id]);

  // Save messages to cache for active convo
  useEffect(() => {
    if (activeConvo && messages.length > 0) {
      localStorage.setItem(`codeown_msgs_${activeConvo.id}`, JSON.stringify(messages.slice(-50)));
    }
  }, [messages, activeConvo]);

  // Load messages from cache is now handled in the main activeConvo effect

  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [messageMenuId, setMessageMenuId] = useState<number | string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<number | string | null>(null);
  const [convoMenuId, setConvoMenuId] = useState<number | string | null>(null);
  const [deletingConvoId, setDeletingConvoId] = useState<number | string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);



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
      setMessages((prev) => (Array.isArray(prev) ? prev : []).map(m => (m.conversation_id === conversationId && !m.is_read && m.sender_id !== readerId) ? { ...m, is_read: true } : m));

      // Also update conversations list to clear unread count for that convo
      setConversations(prev => (Array.isArray(prev) ? prev : []).map(c =>
        (c.id === conversationId && readerId === c.partner.id)
          ? { ...c, unread_count: 0 }
          : c
      ));
    };

    const handleMessageDeleted = ({ messageId }: { messageId: number, conversationId: number }) => {
      setMessages((prev) => (Array.isArray(prev) ? prev : []).filter(m => m.id !== Number(messageId)));
    };

    const handleMessageReaction = ({ messageId, reactions }: { messageId: string, reactions: any }) => {
      setMessages(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === Number(messageId) ? { ...m, reactions } : m));
    };

    const handleNewMessage = (payload: any) => {
      // 1. Play sound if from others
      if (payload.sender_id !== currentUser?.id) {
        new Audio(alertSound).play().catch(() => { });
      }

      // 2. Add to messages if it's the current chat
      const isCorrectChat = activeConvo && (
        String(activeConvo.id) === String(payload.conversation_id) ||
        (String(activeConvo.id) === "0" && String(activeConvo.partner.id) === String(payload.sender_id))
      );

      if (isCorrectChat) {
        // If it was a placeholder conversation, update the ID now that we have one
        if (activeConvo?.id === 0) {
          setActiveConvo(prev => prev ? { ...prev, id: payload.conversation_id } : null);
        }
        clearMessageNotifications(payload.sender_id);

        setMessages((prev) => {
          const safePrev = Array.isArray(prev) ? prev : [];
          if (safePrev.some(m => String(m.id) === String(payload.id))) return safePrev;
          return [...safePrev, payload];
        });
        scrollToBottom(true);
      }

      queryClient.invalidateQueries({ queryKey: ['messages', payload.conversation_id] });

      if (activeConvo && (String(activeConvo.id) === String(payload.conversation_id) || (String(activeConvo.id) === "0" && String(activeConvo.partner.id) === String(payload.sender_id)))) {
        socket.emit("mark_read", {
          senderId: currentUser.id,
          receiverId: payload.sender_id,
          conversationId: payload.conversation_id
        });
      }

      setConversations((prev) => {
        const convoId = payload.conversation_id;
        const safePrev = Array.isArray(prev) ? prev : [];
        const convoIndex = safePrev.findIndex(c => String(c.id) === String(convoId) || (String(c.id) === "0" && String(c.partner.id) === String(payload.sender_id)));
        if (convoIndex === -1) {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          return prev;
        }
        const updated = [...prev];
        const convo = updated[convoIndex];
        updated[convoIndex] = {
          ...convo,
          id: convoId,
          last_message: payload,
          unread_count: (activeConvo && (String(activeConvo.id) === String(convoId) || (String(activeConvo.id) === "0" && String(activeConvo.partner.id) === String(payload.sender_id)))) ? 0 : (convo.unread_count || 0) + 1
        };
        const [moved] = updated.splice(convoIndex, 1);
        return [moved, ...updated];
      });
    };

    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("messages_read", handleMessagesRead);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("message_reaction", handleMessageReaction);
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("messages_read", handleMessagesRead);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("message_reaction", handleMessageReaction);
      socket.off("new_message", handleNewMessage);
    };
  }, [currentUser?.id, activeConvo, queryClient]);

  useEffect(() => {
    if (reactingTo !== null || messageMenuId !== null || convoMenuId !== null) {
      const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
        const picker = document.querySelector(".emoji-picker-overlay");
        const menu = document.querySelector(".message-action-menu");
        const convoMenu = document.querySelector(".convo-action-menu");

        if (picker && !picker.contains(e.target as Node)) {
          setReactingTo(null);
        }
        if (menu && !menu.contains(e.target as Node)) {
          setMessageMenuId(null);
        }
        if (convoMenu && !convoMenu.contains(e.target as Node)) {
          setConvoMenuId(null);
        }
      };

      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
        document.removeEventListener("touchstart", handleOutsideClick);
      };
    }
  }, [reactingTo, messageMenuId, convoMenuId]);

  useEffect(() => {
    if (previewImage) {
      document.body.style.overflow = "hidden";
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") setPreviewImage(null);
      };
      window.addEventListener("keydown", handleEsc);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleEsc);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [previewImage]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("Image size must not exceed 1MB");
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 9) { // 10 seconds max
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(null);
    setRecordingTime(0);
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const handleSendMessage = async (e?: React.FormEvent, directImageUrl?: string) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !selectedImage && !audioBlob && !directImageUrl) || sending) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (activeConvo && activeConvo.partner.id && currentUser?.id) {
      socket.emit("stop_typing", { senderId: currentUser.id, receiverId: activeConvo.partner.id });
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: 0,
      tempId,
      conversation_id: activeConvo?.id || 0,
      sender_id: currentUser!.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      status: 'sending',
      image_url: imagePreview || undefined,
      audio_url: audioPreviewUrl || undefined,
      reply_to: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        sender_id: replyingTo.sender_id,
        image_url: replyingTo.image_url,
        audio_url: replyingTo.audio_url
      } : undefined
    };

    // ADD OPTIMISTICALLY
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    setReplyingTo(null);
    const prevSelectedImage = selectedImage;
    const prevAudioBlob = audioBlob;
    clearImage();
    clearAudio();
    setTimeout(() => scrollToBottom(true), 50);

    setSending(true);
    try {
      const token = await getToken();
      let imageUrl = directImageUrl;

      if (prevSelectedImage) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append("image", prevSelectedImage);
        const uploadRes = await api.post("/upload/image", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        imageUrl = uploadRes.data.url;
        setUploadingImage(false);
      }

      let audioUrl = undefined;
      if (prevAudioBlob) {
        setIsUploadingAudio(true);
        const formData = new FormData();
        formData.append("audio", prevAudioBlob, "voice_message.webm");
        const uploadRes = await api.post("/upload/audio", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        audioUrl = uploadRes.data.url;
        setIsUploadingAudio(false);
      }

      const res = await api.post(
        "/messages",
        {
          conversationId: activeConvo?.id === 0 ? undefined : activeConvo?.id,
          recipientId: activeConvo?.id === 0 ? activeConvo?.partner.id : undefined,
          content: optimisticMessage.content,
          replyToMessageId: replyingTo?.id,
          imageUrl: imageUrl,
          audioUrl: audioUrl,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // REPLACE OPTIMISTIC WITH REAL
      const finalMessage = { ...res.data, status: 'sent' as const };
      setMessages(prev => prev.map(m => m.tempId === tempId ? finalMessage : m));
      queryClient.invalidateQueries({ queryKey: ['messages', activeConvo?.id] });

      if (activeConvo?.id === 0) {
        const newConvoId = res.data.conversation_id;
        setActiveConvo(prev => prev ? { ...prev, id: newConvoId, last_message: finalMessage } : null);
        await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } else {
        // Immediate local conversation list update
        setConversations((prev) => {
          const convoId = activeConvo?.id;
          const safePrev = Array.isArray(prev) ? prev : [];
          const convoIndex = safePrev.findIndex(c => c.id === convoId);
          if (convoIndex === -1) return prev;
          const updated = [...safePrev];
          updated[convoIndex] = { ...updated[convoIndex], last_message: finalMessage, unread_count: 0 };
          const [moved] = updated.splice(convoIndex, 1);
          return [moved, ...updated];
        });
      }
      setTimeout(() => scrollToBottom(true), 100);
    } catch (error) {
      console.error("Error sending message:", error);
      // Mark as error
      setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, status: 'error' } : m));
    } finally {
      setSending(false);
      setUploadingImage(false);
      setIsUploadingAudio(false);
    }
  };

  const handleReaction = async (messageId: number | string, emoji: string) => {
    try {
      const token = await getToken();
      await api.patch(`/messages/message/${messageId}/reaction`, { emoji }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Optimistic Update
      setMessages(prev => (Array.isArray(prev) ? prev : []).map(m => {
        if (m.id === messageId) {
          const currentReactions = m.reactions || {};
          const users = currentReactions[emoji] || [];
          const userId = currentUser!.id;

          if (users.includes(userId)) {
            // Remove
            const newUsers = users.filter(id => id !== userId);
            const newReactions = { ...currentReactions };
            if (newUsers.length === 0) delete newReactions[emoji];
            else newReactions[emoji] = newUsers;
            return { ...m, reactions: newReactions };
          } else {
            // Add
            return {
              ...m,
              reactions: {
                ...currentReactions,
                [emoji]: [...users, userId]
              }
            };
          }
        }
        return m;
      }));
    } finally {
      setReactingTo(null);
    }
  };

  const handleDeleteMessage = async (messageId: number | string) => {
    try {
      const token = await getToken();
      await api.delete(`/messages/message/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Optimistic update
      setMessages(prev => (Array.isArray(prev) ? prev : []).filter(m => m.id !== messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
      // Use console only — no alert
    } finally {
      setReactingTo(null);
      setMessageMenuId(null);
      setDeletingMessageId(null);
    }
  };

  const handleDeleteConversation = async (convoId: number | string) => {
    try {
      setDeletingConvoId(convoId);
      const token = await getToken();
      await api.delete(`/messages/conversation/${convoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update React Query cache immediately
      queryClient.setQueryData(['conversations'], (old: Conversation[] | undefined) => {
        if (!old) return [];
        return old.filter(c => c.id !== convoId);
      });

      // Also update local state
      setConversations(prev => (Array.isArray(prev) ? prev : []).filter(c => c.id !== convoId));

      if (activeConvo?.id === convoId) {
        setActiveConvo(null);
      }

      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    } finally {
      setDeletingConvoId(null);
      setConvoMenuId(null);
    }
  };

  const lastTypingTimeRef = useRef<number>(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    announce("chatting");

    if (activeConvo && activeConvo.partner.id && currentUser?.id) {
      const now = Date.now();
      // Only emit typing event every 1.5 seconds to save bandwidth/overhead
      if (now - lastTypingTimeRef.current > 1500) {
        socket.emit("typing", { senderId: currentUser.id, receiverId: activeConvo.partner.id });
        lastTypingTimeRef.current = now;
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { senderId: currentUser.id, receiverId: activeConvo.partner.id });
      }, 3000);
    }
  };

  const filteredConversations = (Array.isArray(conversations) ? conversations : []).filter(
    (convo) =>
      convo?.partner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (convo?.partner?.username &&
        convo?.partner?.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loadingConversations) {
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
      onClick={() => {
        setMessageMenuId(null);
        setConvoMenuId(null);
        setReactingTo(null);
      }}
      style={{
        display: "flex",
        flexDirection: "row",
        height: isMobile ? "calc(100vh - 144px)" : "100vh",
        maxWidth: "100%",
        overflow: "hidden",
        backgroundColor: "var(--bg-page)",
        position: "relative"
      }}
    >
      {/* Sidebar */}
      {(!isMobile || !activeConvo) && (
        <div
          style={{
            width: sidebarWidth,
            minWidth: isMobile ? "100%" : "300px",
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
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                  flex: 1,
                  minWidth: 0
                }}
              >
                Messages
              </h1>
              <button
                onClick={() => setIsNewMessageModalOpen(true)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-sm)",
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
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-input)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px" }}>
                  <HugeiconsIcon icon={MessageAdd01Icon} size={22} />
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
                borderRadius: "var(--radius-sm)",
                border: "0.5px solid var(--border-hairline)",
              }}
            >
              <HugeiconsIcon icon={Search01Icon} size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  background: "none",
                  flex: 1,
                  outline: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  padding: "2px 0",
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
            {loadingConversations ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--bg-hover)", flexShrink: 0, animation: "shimmer 1.5s infinite linear" }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ width: "40%", height: "14px", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-sm)", animation: "shimmer 1.5s infinite linear" }} />
                      <div style={{ width: "70%", height: "12px", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-sm)", animation: "shimmer 1.5s infinite linear" }} />
                    </div>
                  </div>
                ))}
                <style>{`
                  @keyframes shimmer {
                    0% { opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { opacity: 0.5; }
                  }
                `}</style>
              </div>
            ) : conversations.length === 0 && !targetUserId ? (
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
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-hover)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "0.5px solid var(--border-hairline)"
                  }}
                >
                  <HugeiconsIcon icon={MessageAdd01Icon} size={24} style={{ color: "var(--text-tertiary)" }} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0, fontSize: "14px" }}>
                    No conversations
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "6px" }}>
                    Start a conversation with someone from the community.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewMessageModalOpen(true)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "12px",
                    fontWeight: 600,
                    backgroundColor: "var(--text-primary)",
                    color: "var(--bg-page)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  New message
                </button>
              </div>
            ) : null}
            {!loadingConversations && filteredConversations.map((convo) => (
              <ConversationItem
                key={convo.id}
                convo={convo}
                isActive={activeConvo?.id === convo.id}
                typingUsers={typingUsers}
                currentUser={currentUser}
                convoMenuId={convoMenuId}
                setConvoMenuId={setConvoMenuId}
                deletingConvoId={deletingConvoId}
                onSelect={(c) => {
                  setActiveConvo(c);
                  clearMessageNotifications(c.partner.id);
                  if (c.unread_count && c.unread_count > 0) {
                    setConversations(prev =>
                      (Array.isArray(prev) ? prev : []).map(item => item.id === c.id ? { ...item, unread_count: 0 } : item)
                    );
                  }
                }}
                onProfile={(c) => navigate(`/user/${c.partner.id}`)}
                onDelete={handleDeleteConversation}
              />
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
                  padding: isMobile ? "20px" : "14px",
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
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
                  </button>
                )}
                <div
                  onClick={() => navigate(`/user/${activeConvo.partner.id}`)}
                  style={{ cursor: "pointer", flexShrink: 0 }}
                >
                  <AvailabilityBadge
                    avatarUrl={activeConvo.partner.avatar_url}
                    name={activeConvo.partner.name}
                    size={36}
                    isOG={activeConvo.partner.is_og}
                    username={activeConvo.partner.username}
                  />
                </div>
                {qMessagesLoading && activeConvo.id === 0 ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ width: "120px", height: "14px", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-sm)", animation: "shimmer 1.5s infinite linear" }} />
                    <div style={{ width: "80px", height: "10px", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-sm)", animation: "shimmer 1.5s infinite linear" }} />
                  </div>
                ) : (
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: "16px",
                        color: "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onClick={() => navigate(`/user/${activeConvo.partner.id}`)}
                    >
                      {activeConvo.partner.name}
                      <VerifiedBadge username={activeConvo.partner.username} size="14px" />
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                      @{activeConvo.partner.username || "user"}
                    </div>
                  </div>
                )}

              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: isMobile ? "20px 16px" : "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {qMessagesLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} style={{
                        display: "flex",
                        flexDirection: i % 2 === 0 ? "row" : "row-reverse",
                        gap: "12px",
                        alignItems: "flex-end"
                      }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--bg-hover)", animation: "shimmer 1.5s infinite linear" }} />
                        <div style={{
                          maxWidth: "60%",
                          width: "200px",
                          height: "60px",
                          backgroundColor: "var(--bg-hover)",
                          borderRadius: "var(--radius-sm)",
                          animation: "shimmer 1.5s infinite linear"
                        }} />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "80px 24px",
                      textAlign: "center",
                      animation: "reactionFadeUp 0.4s ease-out"
                    }}
                  >
                    <div style={{ position: "relative", marginBottom: "24px" }}>
                      <AvailabilityBadge
                        avatarUrl={activeConvo.partner.avatar_url}
                        name={activeConvo.partner.name}
                        size={84}
                        isOG={activeConvo.partner.is_og}
                        username={activeConvo.partner.username}
                      />
                      <div style={{
                        position: "absolute",
                        bottom: "-4px",
                        right: "-4px",
                        width: "32px",
                        height: "32px",
                        backgroundColor: "var(--bg-page)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "0.5px solid var(--border-hairline)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                      }}>
                        <HugeiconsIcon icon={Chat01Icon} size={18} color="var(--text-primary)" />
                      </div>
                    </div>

                    <h3 style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "var(--text-primary)",
                      margin: "0 0 8px 0",
                      letterSpacing: "-0.01em"
                    }}>
                      Start of conversation with {activeConvo.partner.name.split(' ')[0]}
                    </h3>

                    <p style={{
                      fontSize: "14px",
                      color: "var(--text-tertiary)",
                      maxWidth: "280px",
                      lineHeight: "1.6",
                      margin: 0
                    }}>
                      Say hello and start building something together.
                    </p>

                    <div style={{
                      marginTop: "32px",
                      padding: "10px 16px",
                      backgroundColor: "var(--bg-hover)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text-tertiary)",
                      border: "0.5px solid var(--border-hairline)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <HugeiconsIcon icon={InformationCircleIcon} size={14} />
                      Messages are encrypted end-to-end
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {messages.map((msg, index) => {
                      const prevMsg = messages[index - 1];
                      const nextMsg = messages[index + 1];
                      const showSender = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                      const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                      return (
                        <motion.div
                          key={msg.id || msg.tempId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <MessageBubble
                            msg={msg}
                            isMine={msg.sender_id === currentUser?.id}
                            showSender={showSender}
                            isLastInGroup={isLastInGroup}
                            activeConvo={activeConvo}
                            currentUser={currentUser}
                            messageMenuId={messageMenuId}
                            setMessageMenuId={setMessageMenuId}
                            deletingMessageId={deletingMessageId}
                            setDeletingMessageId={setDeletingMessageId}
                            onDelete={handleDeleteMessage}
                            onReply={setReplyingTo}
                            onReaction={handleReaction}
                            onPreviewImage={setPreviewImage}
                            reactingTo={reactingTo}
                            setReactingTo={setReactingTo}
                            onNavigatePost={(id) => navigate(`/post/${id}`)}
                            onNavigateProject={(id) => navigate(`/project/${id}`)}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {activeConvo && typingUsers[activeConvo.partner.id] && (
                  <div
                    style={{
                      alignSelf: "flex-start",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 16px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--bg-hover)",
                      border: "0.5px solid var(--border-hairline)",
                      marginTop: "4px"
                    }}
                  >
                    <div style={{ backgroundColor: "var(--text-primary)", width: "6px", height: "6px", borderRadius: "var(--radius-sm)", animation: "typing-bounce 1.4s infinite ease-in-out both", animationDelay: "-0.32s" }} />
                    <div style={{ backgroundColor: "var(--text-primary)", width: "6px", height: "6px", borderRadius: "var(--radius-sm)", animation: "typing-bounce 1.4s infinite ease-in-out both", animationDelay: "-0.16s" }} />
                    <div style={{ backgroundColor: "var(--text-primary)", width: "6px", height: "6px", borderRadius: "var(--radius-sm)", animation: "typing-bounce 1.4s infinite ease-in-out both" }} />
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
                  position: "relative"
                }}
              >
                {/* Reply Preview */}
                {replyingTo && (
                  <div
                    style={{
                      padding: "12px 16px",
                      backgroundColor: "var(--bg-hover)",
                      borderBottom: "0.5px solid var(--border-hairline)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      animation: "slide-down 0.2s ease-out"
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                        Replying to {replyingTo.sender_id === currentUser?.id ? "yourself" : activeConvo.partner.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {replyingTo.content || (replyingTo.audio_url ? "🎤 Voice Message" : (replyingTo.image_url ? "📷 Image" : ""))}
                      </div>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-primary)",
                        padding: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={18} />
                    </button>
                  </div>
                )}

                {/* Image Preview */}
                {imagePreview && (
                  <div
                    style={{
                      padding: "12px 16px",
                      backgroundColor: "var(--bg-hover)",
                      borderBottom: "0.5px solid var(--border-hairline)",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      animation: "slide-down 0.2s ease-out"
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "var(--radius-sm)",
                          objectFit: "cover",
                          border: "0.5px solid var(--border-hairline)"
                        }}
                      />
                      <button
                        onClick={clearImage}
                        style={{
                          position: "absolute",
                          top: "-8px",
                          right: "-4px",
                          width: "-5px",
                          height: "15px",
                          borderRadius: "50%",
                          backgroundColor: "#fff",
                          color: "#000",
                          border: "1px solid var(--border-hairline)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          zIndex: 10
                        }}
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={12} />
                      </button>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{selectedImage?.name}</div>
                      <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                        {((selectedImage?.size || 0) / 1024).toFixed(0)} KB
                      </div>
                    </div>
                  </div>
                )}

                {/* Audio Preview */}
                {audioPreviewUrl && !isRecording && (
                  <div
                    style={{
                      padding: "12px 16px",
                      backgroundColor: "var(--bg-hover)",
                      borderBottom: "0.5px solid var(--border-hairline)",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      animation: "slide-down 0.2s ease-out"
                    }}
                  >
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
                      <audio src={audioPreviewUrl} controls style={{ height: "30px", flex: 1 }} />
                    </div>
                    <button
                      onClick={clearAudio}
                      type="button"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: "var(--bg-input)",
                        color: "var(--text-primary)",
                        border: "0.5px solid var(--border-hairline)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        padding: "4px",
                        margin: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                        e.currentTarget.style.color = "var(--text-error, #ff4444)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--bg-input)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={16} />
                    </button>
                  </div>
                )}

                <form
                  onSubmit={handleSendMessage}
                  style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px 0 0" }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    style={{ display: "none" }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      border: "1px solid var(--border-hairline)",
                      backgroundColor: "transparent",
                      color: "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <HugeiconsIcon icon={Image01Icon} size={28} />
                  </button>

                  {/* Gif Button */}
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => setIsGifPickerOpen(!isGifPickerOpen)}
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "14px",
                        border: "1px solid var(--border-hairline)",
                        backgroundColor: isGifPickerOpen ? "var(--bg-hover)" : "transparent",
                        color: "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={(e) => {
                        if (!isGifPickerOpen) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <HugeiconsIcon icon={GifIcon} size={28} />
                    </button>

                    {isGifPickerOpen && (
                      <div style={{
                        position: "absolute",
                        bottom: "100%",
                        left: 0,
                        marginBottom: "12px",
                        zIndex: 2000
                      }}>
                        <GifPicker
                          onSelect={(gifUrl) => {
                            // Direct send GIF
                            handleSendMessage(undefined, gifUrl);
                            setIsGifPickerOpen(false);
                          }}
                          onClose={() => setIsGifPickerOpen(false)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Mic Button */}
                  {!audioPreviewUrl && (
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "14px",
                        border: "1px solid var(--border-hairline)",
                        backgroundColor: isRecording ? "var(--text-error, #ff4444)" : "transparent",
                        color: isRecording ? "#fff" : "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        if (!isRecording) e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isRecording) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {isRecording ? <HugeiconsIcon icon={Square01Icon} size={28} /> : <HugeiconsIcon icon={Mic01Icon} size={28} />}
                    </button>
                  )}

                  <div style={{ flex: 1, position: "relative" }}>
                    {isRecording ? (
                      <div
                        style={{
                          width: "100%",
                          height: "44px",
                          padding: "12px 16px",
                          borderRadius: "var(--radius-sm)",
                          border: "0.5px solid var(--border-hairline)",
                          backgroundColor: "var(--bg-input)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          color: "var(--text-error, #ff4444)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "currentColor", animation: "pulse 1.5s infinite" }} />
                        Recording 0:0{recordingTime} / 0:10
                      </div>
                    ) : (
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
                        placeholder={audioBlob ? "Message attached with voice recording..." : "Type a message..."}
                        disabled={!!audioBlob}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "var(--radius-sm)",
                          border: "0.5px solid var(--border-hairline)",
                          outline: "none",
                          backgroundColor: audioBlob ? "var(--bg-hover)" : "var(--bg-input)",
                          fontSize: "14px",
                          color: "var(--text-primary)",
                          transition: "all 0.15s ease",
                          minWidth: 0,
                          opacity: audioBlob ? 0.7 : 1,
                        }}
                        onFocus={(e) => {
                          if (!audioBlob) e.currentTarget.style.borderColor = "var(--text-primary)";
                        }}
                        onBlur={(e) => {
                          if (!audioBlob) e.currentTarget.style.borderColor = "var(--border-hairline)";
                        }}
                      />
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedImage && !audioBlob) || sending || uploadingImage || isUploadingAudio || isRecording}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      border: "none",
                      backgroundColor: (newMessage.trim() || selectedImage || audioBlob) ? "var(--text-primary)" : "var(--bg-hover)",
                      color: (newMessage.trim() || selectedImage || audioBlob) ? "var(--bg-page)" : "var(--text-tertiary)",
                      cursor: (newMessage.trim() || selectedImage) ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                  >
                    {uploadingImage || isUploadingAudio ? (
                      <HugeiconsIcon icon={ReloadIcon} size={26} className="spin-animation" />
                    ) : (
                      <HugeiconsIcon icon={SentIcon} size={26} />
                    )}
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
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--bg-hover)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "0.5px solid var(--border-hairline)"
                }}
              >
                <HugeiconsIcon icon={Chat01Icon} size={32} style={{ color: "var(--text-tertiary)" }} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Your messages
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

      {/* Image Previewer Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            animation: "fadeIn 0.2s ease",
            padding: "20px"
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(null);
            }}
            style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#fff",
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              backdropFilter: "blur(10px)",
              zIndex: 10000
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={24} />
          </button>

          <img
            src={previewImage}
            alt="Preview"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "100%",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: "var(--radius-sm)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              animation: "imageScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          />
        </div>
      )}

      <SEO title="Messages" description="Connect and collaborate with other builders through direct messaging on Codeown." />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes imageScale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes typing-bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-down {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes reactionFadeUp {
          from { transform: translateY(10px) scale(0.8); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .message-container .reply-button,
        .message-container .msg-dots-trigger {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .message-container:hover .reply-button,
        .message-container:hover .msg-dots-trigger {
          opacity: 1;
        }
        @media (max-width: 768px) {
          .message-container .reply-button,
          .message-container .msg-dots-trigger {
            opacity: 1;
          }
        }
        .convo-container .convo-dots-container {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }
        .convo-container:hover .convo-dots-container,
        .convo-container .convo-dots-container.is-open {
          opacity: 1;
          pointer-events: auto;
        }
        .convo-container:hover .convo-timestamp-label {
          opacity: 0;
        }
        @media (max-width: 1024px) {
          .convo-container .convo-dots-container {
            opacity: 1;
            pointer-events: auto;
          }
        }
      `}</style>
    </main>
  );
}
