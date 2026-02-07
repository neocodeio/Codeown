import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";

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
    job_title?: string | null;
    location?: string | null;
    experience_level?: string | null;
    skills?: string[] | null;
    is_hirable?: boolean;
    is_organization?: boolean;
    github_url?: string | null;
    twitter_url?: string | null;
    linkedin_url?: string | null;
    website_url?: string | null;
    banner_url?: string | null;
  };
}

export default function EditProfileModal({ isOpen, onClose, onUpdated, currentUser }: EditProfileModalProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isOrganization, setIsOrganization] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const { getToken, isLoaded } = useClerkAuth();
  const { width } = useWindowSize();
  const isMobile = width < 640;

  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || "");
      setUsername(currentUser.username || "");
      setBio(currentUser.bio || "");
      setIsOrganization(currentUser.is_organization ?? false);
      setAvatarPreview(currentUser.avatar_url);
      setGithubUrl(currentUser.github_url || "");
      setTwitterUrl(currentUser.twitter_url || "");
      setLinkedinUrl(currentUser.linkedin_url || "");
      setWebsiteUrl(currentUser.website_url || "");
      setSkills(currentUser.skills || []);
      setSkillInput("");
      setAvatarFile(null);
      setBannerFile(null);
      setBannerPreview(currentUser.banner_url || null);
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Banner image size must be less than 10MB");
        return;
      }
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
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

  const handleAddSkill = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
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
      let bannerUrl = currentUser.banner_url;
      if (avatarFile) {
        const uploadedAvatarUrl = await uploadImage(avatarFile);
        if (uploadedAvatarUrl) {
          avatarUrl = uploadedAvatarUrl;
        }
      }
      if (bannerFile) {
        const uploadedBannerUrl = await uploadImage(bannerFile);
        if (uploadedBannerUrl) {
          bannerUrl = uploadedBannerUrl;
        }
      }

      await api.put(
        `/users/${currentUser.id}`,
        {
          name: name.trim(),
          username: username.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          is_organization: isOrganization,
          github_url: githubUrl.trim() || null,
          twitter_url: twitterUrl.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          website_url: websiteUrl.trim() || null,
          skills: skills.length > 0 ? skills : null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Dispatch custom event to notify other components (like Navbar) to refresh user data
      window.dispatchEvent(new CustomEvent("profileUpdated"));

      onUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      let errorMessage = "Failed to update profile";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { error?: string; details?: string } } };
        const errorData = axiosError.response?.data;

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
      } else if (error instanceof Error) {
        errorMessage = error.message;
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
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideIn { from { opacity: 0; transform: scale(0.95) translateY(-20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .modal-backdrop { animation: modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .modal-dialog { animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .modal-input {
          width: 100%;
          padding: 14px 20px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.2s ease;
          background: #f8fafc;
          color: #0f172a;
          outline: none;
          box-sizing: border-box;
        }
        @media (max-width: 640px) {
          .modal-input {
            padding: 12px 16px;
            font-size: 14px;
          }
        }
        .modal-input:focus {
          border-color: #212121;
          background: white;
          box-shadow: 0 0 0 4px rgba(33, 33, 33, 0.05);
        }
        .modal-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .modal-label {
          display: block;
          font-size: 13px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          margin-left: 4px;
        }
        .modal-btn {
          padding: 12px 24px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .modal-btn-primary {
          background: #212121;
          color: white;
          border: none;
        }
        .modal-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-btn-secondary {
          background: transparent;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        .modal-btn-secondary:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
        .skill-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f1f5f9;
          color: #0f172a;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid #e2e8f0;
        }
        .skill-remove {
          cursor: pointer;
          color: #94a3b8;
          font-size: 14px;
          display: flex;
          align-items: center;
        }
        .skill-remove:hover { color: #ef4444; }
      `}</style>

      <div
        className="modal-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="modal-dialog"
          style={{
            width: "100%",
            maxWidth: "520px",
            maxHeight: "90vh",
            margin: isMobile ? "16px" : "auto",
            backgroundColor: "white",
            borderRadius: isMobile ? "24px" : "32px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: isMobile ? "20px 24px 12px" : "32px 32px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? "20px" : "24px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" }}>Edit Profile</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "28px", color: "#94a3b8", cursor: "pointer", display: "flex" }}>&times;</button>
          </div>

          <div style={{ padding: isMobile ? "0 24px 24px" : "0 32px 32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: isMobile ? "16px" : "24px" }}>
            {/* Avatar Section */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "16px 0" }}>
              <label style={{ cursor: "pointer", position: "relative" }}>
                <div style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "40px",
                  overflow: "hidden",
                  border: "4px solid #f1f5f9",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.05)"
                }}>
                  <img src={avatarPreview || `https://ui-avatars.com/api/?name=${name}&background=212121&color=fff`} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Preview" />
                </div>
                <div style={{
                  position: "absolute",
                  bottom: "-6px",
                  right: "-6px",
                  background: "#212121",
                  color: "white",
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
                }}>
                  UP
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
              </label>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Change Avatar</span>
            </div>

            {/* Banner Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label className="modal-label">Profile Banner</label>
              <label style={{ cursor: "pointer", position: "relative", width: "100%" }}>
                <div style={{
                  width: "100%",
                  height: "120px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "2px solid #f1f5f9",
                  backgroundColor: "#f8fafc",
                  position: "relative"
                }}>
                  {bannerPreview ? (
                    <img src={bannerPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Banner Preview" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "14px", fontWeight: 600 }}>
                      No banner image set
                    </div>
                  )}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0,
                    transition: "opacity 0.2s",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 800
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}
                  >
                    CHANGE BANNER
                  </div>
                </div>
                <input type="file" accept="image/*" onChange={handleBannerChange} style={{ display: "none" }} />
              </label>
              <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "4px" }}>Recommended size: 1500x500px</span>
            </div>

            {/* Form Fields */}
            <div>
              <label className="modal-label">Display Name</label>
              <input className="modal-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
            </div>

            <div>
              <label className="modal-label">
                Username
                {!canChange && (
                  <span style={{ color: "#f59e0b", float: "right", textTransform: "none" }}>Locked for 14d</span>
                )}
              </label>
              <input
                className="modal-input"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setUsernameError(null); }}
                disabled={!canChange && username === currentUser.username}
                placeholder="username"
              />
              {usernameError && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px", fontWeight: 600 }}>{usernameError}</p>}
            </div>

            <div>
              <label className="modal-label">Bio</label>
              <textarea
                className="modal-input"
                style={{ resize: "none" }}
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community who you are..."
              />
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
              <span className="modal-label" style={{ color: "#0f172a", marginBottom: "16px" }}>Social Links</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label className="modal-label" style={{ fontSize: "11px" }}>GitHub URL</label>
                  <input className="modal-input" type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/your-username" />
                </div>
                <div>
                  <label className="modal-label" style={{ fontSize: "11px" }}>Instagram URL</label>
                  <input className="modal-input" type="url" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://instagram.com/your-username" />
                </div>
                <div>
                  <label className="modal-label" style={{ fontSize: "11px" }}>LinkedIn URL</label>
                  <input className="modal-input" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/your-username" />
                </div>
                <div>
                  <label className="modal-label" style={{ fontSize: "11px" }}>Personal Website</label>
                  <input className="modal-input" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://your-website.com" />
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "24px" }}>
              <label className="modal-label">Tech Stack & Skills</label>
              <form onSubmit={handleAddSkill} style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <input
                  className="modal-input"
                  style={{ flex: 1 }}
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add a skill (e.g. React, Node.js)"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="modal-btn modal-btn-secondary"
                  style={{ padding: "0 20px" }}
                >
                  Add
                </button>
              </form>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {skills.map((skill) => (
                  <div key={skill} className="skill-tag">
                    {skill}
                    <span
                      className="skill-remove"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      &times;
                    </span>
                  </div>
                ))}
                {skills.length === 0 && (
                  <div style={{ fontSize: "14px", color: "#94a3b8", fontStyle: "italic", padding: "4px" }}>
                    No skills added yet. Add your tech stack to stand out!
                  </div>
                )}
              </div>
            </div>

            {/* Developer Settings Removed */}
          </div>

          {/* Footer Actions */}
          <div style={{ padding: isMobile ? "16px 24px" : "24px 32px", backgroundColor: "#f8fafc", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button className="modal-btn modal-btn-secondary" style={{ padding: isMobile ? "10px 16px" : "12px 24px" }} onClick={onClose}>Cancel</button>
            <button
              className="modal-btn modal-btn-primary"
              style={{ padding: isMobile ? "10px 16px" : "12px 24px" }}
              onClick={submit}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}