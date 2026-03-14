import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import { updateAvatarCache } from "../hooks/useAvatar";
import { validateImageSize } from "../constants/upload";
import { Camera } from "phosphor-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedUser?: Record<string, unknown>) => void;
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
    is_pro?: boolean;
    is_organization?: boolean;
    github_url?: string | null;
    twitter_url?: string | null;
    linkedin_url?: string | null;
    website_url?: string | null;
    banner_url?: string | null;
  };
  projectCount?: number;
}

export default function EditProfileModal({ isOpen, onClose, onUpdated, currentUser, projectCount = 0 }: EditProfileModalProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
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
  const [isHirable, setIsHirable] = useState(false);
  const { getToken, isLoaded } = useClerkAuth();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const canToggleOpenToOpportunities =
    (projectCount ?? 0) > 0 && skills.length > 0 && bio.trim().length > 0;

  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || "");
      setUsername(currentUser.username || "");
      setBio(currentUser.bio || "");
      setJobTitle(currentUser.job_title || "");
      setLocation(currentUser.location || "");
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
      setIsHirable(currentUser.is_hirable ?? false);
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
      const sizeError = validateImageSize(file);
      if (sizeError) {
        alert(sizeError);
        e.target.value = "";
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
      const sizeError = validateImageSize(file);
      if (sizeError) {
        alert(sizeError);
        e.target.value = "";
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

      console.log(`Processing avatar: ${(file.size / 1024).toFixed(2)}KB`);

      // Dynamic import to avoid SSR issues
      const { compressImageSimple, needsCompression } = await import("../utils/imageCompression");

      let fileToUpload = file;

      // Check if compression is needed (only if file > 200KB)
      if (needsCompression(file, 200)) {
        console.log(`Compressing avatar from ${(file.size / 1024 / 1024).toFixed(2)}MB...`);

        try {
          // Use simple compression utility
          fileToUpload = await compressImageSimple(file, {
            maxSizeKB: 200,
            maxWidth: 800, // Smaller for avatars
            maxHeight: 800,
            quality: 0.8,
          });
        } catch (compressionError) {
          console.error("Compression failed, using original:", compressionError);
        }
      } else {
        console.log("Avatar is already under 200KB, no compression needed");
      }

      const formData = new FormData();
      formData.append("image", fileToUpload);

      const response = await api.post("/upload/image", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.url;
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

      const res = await api.put(
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
          job_title: jobTitle.trim() || null,
          location: location.trim() || null,
          skills: skills.length > 0 ? skills : null,
          is_hirable: isHirable,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update the avatar cache to ensure immediate visibility across all components
      updateAvatarCache(currentUser.id, avatarUrl);

      // Apply updated user (e.g. is_hirable) immediately so badge appears without waiting for refetch
      const updatedUser = res.data?.user;
      if (typeof onUpdated === "function") {
        onUpdated(updatedUser);
      }

      // Dispatch custom event to notify other components (like Navbar) to refresh user data
      window.dispatchEvent(new CustomEvent("profileUpdated"));

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
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}>
        <div
          style={{
            width: "100%",
            maxWidth: isMobile ? "100%" : "600px",
            maxHeight: isMobile ? "100vh" : "90vh",
            margin: 0,
            backgroundColor: "var(--bg-page)",
            borderRadius: "2px",
            boxShadow: "none",
            border: "0.5px solid var(--border-hairline)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "0.5px solid var(--border-hairline)" }}>
            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Edit Profile</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", color: "var(--text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}>&times;</button>
          </div>

          <div style={{ padding: "40px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* Avatar Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>Avatar</label>
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <label style={{ cursor: "pointer", position: "relative" }}>
                  <div style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "2px",
                    overflow: "hidden",
                    border: "0.5px solid var(--border-hairline)",
                    backgroundColor: "var(--bg-hover)"
                  }}>
                    <img src={avatarPreview || `https://ui-avatars.com/api/?name=${name}&background=000&color=fff`} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Preview" />
                  </div>
                  <div style={{
                    position: "absolute",
                    bottom: "-4px",
                    right: "-4px",
                    background: "var(--text-primary)",
                    color: "var(--bg-page)",
                    padding: "8px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                    border: "2px solid var(--bg-page)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                  }}>
                    <Camera size={16} weight="bold" />
                  </div>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
                </label>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>CHANGE AVATAR</p>
                  <p style={{ margin: "4px 0 0" }}>Minimalist square profile. 2px radius.</p>
                </div>
              </div>
            </div>

            {/* Banner Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", fontFamily: "var(--font-mono)" }}>Profile Banner</label>
              <label style={{ cursor: "pointer", position: "relative", width: "100%" }}>
                <div style={{
                  width: "100%",
                  height: "120px",
                  borderRadius: "2px",
                  overflow: "hidden",
                  border: "0.5px solid var(--border-hairline)",
                  backgroundColor: "var(--bg-hover)",
                  position: "relative"
                }}>
                  {bannerPreview ? (
                    <img src={bannerPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Banner Preview" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 800 }}>
                      NO BANNER DATA
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
                    fontSize: "10px",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase"
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}
                  >
                    CHANGE BANNER
                  </div>
                </div>
                <input type="file" accept="image/*" onChange={handleBannerChange} style={{ display: "none" }} />
              </label>
              <span style={{ fontSize: "9px", color: "var(--text-tertiary)", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Recommended size: 1500x500px</span>
            </div>

            {/* Form Fields */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", marginBottom: "12px" }}>Display Name</label>
              <input style={{ width: "100%", padding: "14px 18px", border: "0.5px solid var(--border-hairline)", borderRadius: "2px", fontSize: "14px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="FULL NAME..." />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", marginBottom: "12px" }}>
                Username
                {!canChange && (
                  <span style={{ color: "var(--text-tertiary)", float: "right", textTransform: "uppercase", fontSize: "10px" }}>LOCKED FOR 14D</span>
                )}
              </label>
              <input
                style={{ width: "100%", padding: "14px 18px", border: "0.5px solid var(--border-hairline)", borderRadius: "2px", fontSize: "14px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setUsernameError(null); }}
                disabled={!canChange && username === currentUser.username}
                placeholder="USERNAME..."
              />
              {usernameError && <p style={{ color: "#ef4444", fontSize: "11px", marginTop: "8px", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{usernameError}</p>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", marginBottom: "12px" }}>Job Title</label>
              <input style={{ width: "100%", padding: "14px 18px", border: "0.5px solid var(--border-hairline)", borderRadius: "2px", fontSize: "14px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. FULL STACK DEVELOPER" />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", marginBottom: "12px" }}>Location</label>
              <input style={{ width: "100%", padding: "14px 18px", border: "0.5px solid var(--border-hairline)", borderRadius: "2px", fontSize: "14px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. SAN FRANCISCO, CA" />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", marginBottom: "12px" }}>Bio</label>
              <textarea
                style={{ width: "100%", padding: "14px 18px", border: "0.5px solid var(--border-hairline)", borderRadius: "2px", fontSize: "14px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box", resize: "none", lineHeight: 1.6 }}
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="TELL THE COMMUNITY WHO YOU ARE..."
              />
            </div>

            <div style={{ borderTop: "0.5px solid var(--border-hairline)", paddingTop: "12px" }}>
              <span style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "20px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Social Links</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", marginBottom: "8px" }}>GitHub URL</label>
                  <input style={{ width: "100%", padding: "12px 16px", border: "0.5px solid var(--border-hairline)", borderRadius: "2px", fontSize: "13px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-mono)" }} type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", marginBottom: "8px" }}>Instagram URL</label>
                  <input style={{ width: "100%", padding: "12px 16px", border: "0.5px solid var(--border-hairline)", borderRadius: "2px", fontSize: "13px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-mono)" }} type="url" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", marginBottom: "8px" }}>LinkedIn URL</label>
                  <input style={{ width: "100%", padding: "12px 16px", border: "0.5px solid var(--border-hairline)", borderRadius: "2px", fontSize: "13px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-mono)" }} type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/..." />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", marginBottom: "8px" }}>Personal Website</label>
                  <input style={{ width: "100%", padding: "12px 16px", border: "0.5px solid var(--border-hairline)", borderRadius: "2px", fontSize: "13px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-mono)" }} type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
            </div>

            <div style={{ borderTop: "0.5px solid var(--border-hairline)", paddingTop: "32px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "20px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Tech Stack & Skills</label>
              <form onSubmit={handleAddSkill} style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                <input
                  style={{ flex: 1, width: "100%", padding: "14px 18px", border: "0.5px solid var(--border-hairline)", borderRadius: "2px", fontSize: "14px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="ADD SKILL (E.G. REACT)..."
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  style={{ padding: "0 24px", borderRadius: "2px", fontSize: "11px", fontWeight: 800, transition: "all 0.15s ease", cursor: "pointer", background: "transparent", color: "var(--text-tertiary)", border: "0.5px solid var(--border-hairline)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
                >
                  ADD
                </button>
              </form>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {skills.map((skill) => (
                  <div key={skill} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--bg-hover)", color: "var(--text-primary)", padding: "8px 14px", borderRadius: "2px", fontSize: "11px", fontWeight: 700, border: "0.5px solid var(--border-hairline)", cursor: "default", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                    {skill}
                    <span
                      style={{ cursor: "pointer", color: "var(--text-tertiary)", fontSize: "14px", marginLeft: "4px" }}
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      &times;
                    </span>
                  </div>
                ))}
                {skills.length === 0 && (
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontStyle: "italic", padding: "4px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    NO SKILLS ADDED.
                  </div>
                )}
              </div>
            </div>

            {/* Pro: Open to Opportunities */}
            <div style={{ borderTop: "0.5px solid var(--border-hairline)", paddingTop: "32px", marginBottom: "8px" }}>
              {currentUser.is_pro === true && (
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "24px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "8px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Open to Opportunities</label>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                      Indicate that you are open to new professional opportunities.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "16px" }}>
                      <p style={{ margin: 0, fontSize: "11px", color: (projectCount ?? 0) > 0 ? "var(--text-primary)" : "var(--text-tertiary)", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {(projectCount ?? 0) > 0 ? "[✓]" : "[ ]"} PROJECTS
                      </p>
                      <p style={{ margin: 0, fontSize: "11px", color: skills.length > 0 ? "var(--text-primary)" : "var(--text-tertiary)", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {skills.length > 0 ? "[✓]" : "[ ]"} SKILLS
                      </p>
                      <p style={{ margin: 0, fontSize: "11px", color: bio.trim().length > 0 ? "var(--text-primary)" : "var(--text-tertiary)", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {bio.trim().length > 0 ? "[✓]" : "[ ]"} BIO
                      </p>
                    </div>
                  </div>
                  <div
                    onClick={() => canToggleOpenToOpportunities && setIsHirable(!isHirable)}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "2px",
                      border: "0.5px solid var(--border-hairline)",
                      backgroundColor: isHirable ? "var(--text-primary)" : "transparent",
                      color: "var(--bg-page)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      cursor: canToggleOpenToOpportunities ? "pointer" : "not-allowed",
                      transition: "all 0.15s ease"
                    }}
                    title={canToggleOpenToOpportunities ? undefined : "Add a project, at least one skill, and a bio to enable"}
                  >
                    {isHirable && "✓"}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", borderTop: "0.5px solid var(--border-hairline)", paddingTop: "32px" }}>
              <button
                onClick={onClose}
                style={{ padding: "12px 24px", borderRadius: "2px", fontSize: "11px", fontWeight: 800, transition: "all 0.15s ease", cursor: "pointer", background: "transparent", color: "var(--text-tertiary)", border: "0.5px solid var(--border-hairline)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
              >
                CANCEL
              </button>
              <button
                onClick={submit}
                disabled={isSubmitting}
                style={{ padding: "12px 32px", borderRadius: "2px", fontSize: "11px", fontWeight: 800, transition: "all 0.15s ease", cursor: "pointer", background: "var(--text-primary)", color: "var(--bg-page)", border: "none", opacity: isSubmitting ? 0.3 : 1, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.15em" }}
              >
                {isSubmitting ? "UPDATING..." : "SAVE CHANGES"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
