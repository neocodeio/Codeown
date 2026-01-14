import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  currentUser: {
    id: string;
    name: string;
    email: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    username_changed_at: string | null;
  };
}

export default function EditProfileModal({ isOpen, onClose, onUpdated, currentUser }: EditProfileModalProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const { getToken, isLoaded } = useClerkAuth();

  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || "");
      setUsername(currentUser.username || "");
      setBio(currentUser.bio || "");
      setAvatarPreview(currentUser.avatar_url);
      setAvatarFile(null);
      setUsernameError(null);
    }
  }, [isOpen, currentUser]);

  // Check if username can be changed
  const canChangeUsername = () => {
    if (!currentUser.username_changed_at) return true;
    const lastChanged = new Date(currentUser.username_changed_at);
    const daysSinceChange = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceChange >= 14;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const token = await getToken();
      if (!token) return null;

      // Convert file to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload to backend (you'll need to implement image upload endpoint)
      // For now, we'll use a simple approach - convert to data URL
      // In production, upload to Supabase Storage or similar
      return base64;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const submit = async () => {
    if (!isLoaded) {
      alert("Please sign in to update your profile");
      return;
    }

    if (!name.trim()) {
      alert("Name is required");
      return;
    }

    // Check username change restriction
    if (username !== currentUser.username && !canChangeUsername()) {
      const lastChanged = new Date(currentUser.username_changed_at!);
      const daysSinceChange = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
      const daysRemaining = Math.ceil(14 - daysSinceChange);
      setUsernameError(`Username can only be changed once every 14 days. You can change it again in ${daysRemaining} day(s).`);
      return;
    }

    setIsSubmitting(true);
    setUsernameError(null);

    try {
      const token = await getToken();
      if (!token) {
        alert("Please sign in to update your profile");
        setIsSubmitting(false);
        return;
      }

      let avatarUrl = currentUser.avatar_url;
      if (avatarFile) {
        const uploadedUrl = await uploadImage(avatarFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      await api.put(
        `/users/${currentUser.id}`,
        {
          name: name.trim(),
          username: username.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      onUpdated();
      onClose();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      const errorData = error?.response?.data;
      let errorMessage = "Failed to update profile";

      if (errorData) {
        if (errorData.details) {
          errorMessage = `${errorData.error || "Failed to update profile"}: ${errorData.details}`;
        } else if (errorData.error) {
          errorMessage = errorData.error;
          if (errorMessage.includes("14 days")) {
            setUsernameError(errorMessage);
          }
        }
      }

      if (!usernameError) {
        alert(`Failed to update profile: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const canChange = canChangeUsername();

  const modalContent = (
    <>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .modal-backdrop {
          animation: modalFadeIn 0.15s ease-out;
        }
        .modal-dialog {
          animation: modalSlideIn 0.2s ease-out;
        }
        @media (max-width: 640px) {
          .modal-dialog {
            margin: 16px !important;
            max-width: calc(100% - 32px) !important;
          }
        }
      `}</style>

      <div
        className="modal-backdrop"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px",
          overflowY: "auto",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="modal-dialog"
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "500px",
            margin: "auto",
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 32px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "30px",
              border: "1px solid rgba(0, 0, 0, 0.2)",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "100%",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              className="modal-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                borderBottom: "1px solid #e4e7eb",
                flexShrink: 0,
              }}
            >
              <h2
                className="modal-title"
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                }}
              >
                Edit Profile
              </h2>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  fontWeight: 300,
                  color: "#64748b",
                  cursor: "pointer",
                  padding: 0,
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f7fa";
                  e.currentTarget.style.color = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div
              className="modal-body"
              style={{
                padding: "20px",
                overflowY: "auto",
                flex: "1 1 auto",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {/* Avatar Upload */}
              <div style={{ textAlign: "center" }}>
                <label style={{ cursor: "pointer", display: "inline-block" }}>
                  <img
                    src={avatarPreview || "https://ui-avatars.com/api/?name=User&background=317ff5&color=ffffff&size=128"}
                    alt="Avatar"
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "3px solid #e4e7eb",
                      cursor: "pointer",
                    }}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </label>
                <p style={{ marginTop: "8px", fontSize: "14px", color: "#64748b" }}>
                  Click to upload profile image
                </p>
              </div>

              {/* Name */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  marginBottom: "8px",
                }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #e4e7eb",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontFamily: "inherit",
                    outline: "none",
                    transition: "all 0.15s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#317ff5";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(49, 127, 245, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e4e7eb";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Username */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  marginBottom: "8px",
                }}>
                  Username
                  {!canChange && (
                    <span style={{ color: "#f59e0b", marginLeft: "8px", fontSize: "12px" }}>
                      (Can change in {Math.ceil(14 - ((Date.now() - new Date(currentUser.username_changed_at!).getTime()) / (1000 * 60 * 60 * 24)))} days)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError(null);
                  }}
                  placeholder="username"
                  disabled={!canChange && username === currentUser.username}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: usernameError ? "1px solid #dc2626" : "1px solid #e4e7eb",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontFamily: "inherit",
                    outline: "none",
                    transition: "all 0.15s",
                    boxSizing: "border-box",
                    backgroundColor: !canChange && username === currentUser.username ? "#f5f7fa" : "#ffffff",
                    cursor: !canChange && username === currentUser.username ? "not-allowed" : "text",
                  }}
                  onFocus={(e) => {
                    if (canChange || username !== currentUser.username) {
                      e.currentTarget.style.borderColor = "#317ff5";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(49, 127, 245, 0.1)";
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = usernameError ? "#dc2626" : "#e4e7eb";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                {usernameError && (
                  <p style={{ marginTop: "4px", fontSize: "12px", color: "#dc2626" }}>
                    {usernameError}
                  </p>
                )}
              </div>

              {/* Email (Read-only) */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  marginBottom: "8px",
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={currentUser.email || ""}
                  disabled
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #e4e7eb",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontFamily: "inherit",
                    backgroundColor: "#f5f7fa",
                    color: "#64748b",
                    cursor: "not-allowed",
                    boxSizing: "border-box",
                  }}
                />
                <p style={{ marginTop: "4px", fontSize: "12px", color: "#64748b" }}>
                  Email cannot be changed
                </p>
              </div>

              {/* Bio */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  marginBottom: "8px",
                }}>
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #e4e7eb",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontFamily: "inherit",
                    resize: "vertical",
                    outline: "none",
                    transition: "all 0.15s",
                    boxSizing: "border-box",
                    lineHeight: 1.5,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#317ff5";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(49, 127, 245, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e4e7eb";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="modal-footer"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                padding: "16px 20px",
                borderTop: "1px solid #e4e7eb",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6c757d",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "20px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  fontSize: "15px",
                  fontWeight: 500,
                  transition: "all 0.15s",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!isLoaded || !name.trim() || isSubmitting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: isLoaded && name.trim() && !isSubmitting ? "#317ff5" : "#e4e7eb",
                  border: "none",
                  color: isLoaded && name.trim() && !isSubmitting ? "#ffffff" : "#94a3b8",
                  borderRadius: "20px",
                  cursor: isLoaded && name.trim() && !isSubmitting ? "pointer" : "not-allowed",
                  fontSize: "15px",
                  fontWeight: 500,
                  transition: "all 0.15s",
                }}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

