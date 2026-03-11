import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import { updateAvatarCache } from "../hooks/useAvatar";
import { validateImageSize } from "../constants/upload";

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
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}>
        <div
          style={{
            width: "100%",
            maxWidth: isMobile ? "100%" : "520px",
            maxHeight: isMobile ? "92vh" : "90vh",
            margin: 0,
            backgroundColor: "white",
            borderRadius: isMobile ? "24px 24px 0 0" : "32px",
            boxShadow: "0 -10px 25px rgba(0,0,0,0.1), 0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: isMobile ? "24px 20px 12px" : "32px 32px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: isMobile ? "1px solid #f1f5f9" : "none", marginBottom: isMobile ? "12px" : "0" }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? "20px" : "24px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" }}>Edit Profile</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "28px", color: "#94a3b8", cursor: "pointer", display: "flex" }}>&times;</button>
          </div>

          <div style={{ padding: isMobile ? "0 20px 24px" : "0 32px 32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: isMobile ? "16px" : "24px" }}>
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
              <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", marginLeft: "4px" }}>Profile Banner</label>
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
              <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", marginLeft: "4px" }}>Display Name</label>
              <input style={{ width: "100%", padding: "14px 20px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "16px", transition: "all 0.2s ease", background: "#f8fafc", color: "#0f172a", outline: "none", boxSizing: "border-box" }} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", marginLeft: "4px" }}>
                Username
                {!canChange && (
                  <span style={{ color: "#f59e0b", float: "right", textTransform: "none" }}>Locked for 14d</span>
                )}
              </label>
              <input
                style={{ width: "100%", padding: "14px 20px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "16px", transition: "all 0.2s ease", background: "#f8fafc", color: "#0f172a", outline: "none", boxSizing: "border-box" }}
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setUsernameError(null); }}
                disabled={!canChange && username === currentUser.username}
                placeholder="username"
              />
              {usernameError && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px", fontWeight: 600 }}>{usernameError}</p>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", marginLeft: "4px" }}>Bio</label>
              <textarea
                style={{ width: "100%", padding: "14px 20px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "16px", transition: "all 0.2s ease", background: "#f8fafc", color: "#0f172a", outline: "none", boxSizing: "border-box", resize: "none" }}
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community who you are..."
              />
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
              <span style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#0f172a", marginBottom: "16px" }}>Social Links</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", marginLeft: "4px" }}>GitHub URL</label>
                  <input style={{ width: "100%", padding: "14px 20px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "16px", transition: "all 0.2s ease", background: "#f8fafc", color: "#0f172a", outline: "none", boxSizing: "border-box" }} type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/your-username" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", marginLeft: "4px" }}>Instagram URL</label>
                  <input style={{ width: "100%", padding: "14px 20px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "16px", transition: "all 0.2s ease", background: "#f8fafc", color: "#0f172a", outline: "none", boxSizing: "border-box" }} type="url" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://instagram.com/your-username" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", marginLeft: "4px" }}>LinkedIn URL</label>
                  <input style={{ width: "100%", padding: "14px 20px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "16px", transition: "all 0.2s ease", background: "#f8fafc", color: "#0f172a", outline: "none", boxSizing: "border-box" }} type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/your-username" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", marginLeft: "4px" }}>Personal Website</label>
                  <input style={{ width: "100%", padding: "14px 20px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "16px", transition: "all 0.2s ease", background: "#f8fafc", color: "#0f172a", outline: "none", boxSizing: "border-box" }} type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://your-website.com" />
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#0f172a", marginBottom: "16px" }}>Tech Stack & Skills</label>
              <form onSubmit={handleAddSkill} style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <input
                  style={{ flex: 1, width: "100%", padding: "14px 20px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "16px", transition: "all 0.2s ease", background: "#f8fafc", color: "#0f172a", outline: "none", boxSizing: "border-box" }}
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add a skill (e.g. React, Node.js)"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  style={{ padding: "0 20px", borderRadius: "14px", fontSize: "15px", fontWeight: 700, transition: "all 0.2s ease", cursor: "pointer", background: "transparent", color: "#64748b", border: "1px solid #e2e8f0" }}
                >
                  Add
                </button>
              </form>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {skills.map((skill) => (
                  <div key={skill} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f1f5f9", color: "#0f172a", padding: "6px 10px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, border: "1px solid #e2e8f0", cursor: "pointer" }}>
                    {skill}
                    <span
                      style={{ cursor: "pointer" }}
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

            {/* Pro: Open to Opportunities */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "24px", marginBottom: "16px" }}>
              {currentUser.is_pro === true && (
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>Open to Opportunities</label>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.5" }}>
                      Show a badge on your profile indicating you are looking for work.
                    </p>
                    <p style={{ margin: "8px 0 0", fontSize: "12px", color: (projectCount ?? 0) > 0 ? "#10b981" : "#94a3b8", lineHeight: "1.5" }}>
                      {(projectCount ?? 0) > 0 ? "✓" : "×"} At least one project
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: skills.length > 0 ? "#10b981" : "#94a3b8", lineHeight: "1.5" }}>
                      {skills.length > 0 ? "✓" : "×"} At least one skill
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: bio.trim().length > 0 ? "#10b981" : "#94a3b8", lineHeight: "1.5" }}>
                      {bio.trim().length > 0 ? "✓" : "×"} A bio description
                    </p>
                  </div>
                  <div
                    onClick={() => canToggleOpenToOpportunities && setIsHirable(!isHirable)}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      border: isHirable ? "2px solid #10b981" : "2px solid #e2e8f0",
                      backgroundColor: isHirable ? "#10b981" : "white",
                      color: isHirable ? "white" : "#64748b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: canToggleOpenToOpportunities ? "pointer" : "not-allowed",
                      opacity: canToggleOpenToOpportunities ? 1 : 0.6,
                      transition: "all 0.2s ease"
                    }}
                    title={canToggleOpenToOpportunities ? undefined : "Add a project, at least one skill, and a bio to enable"}
                  >
                    {isHirable ? "✓" : "○"}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: isMobile ? "stretch" : "flex-end", gap: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "24px" }}>
              <button
                onClick={onClose}
                style={{ padding: "12px 24px", borderRadius: "14px", fontSize: "15px", fontWeight: 700, transition: "all 0.2s ease", cursor: "pointer", background: "transparent", color: "#64748b", border: "1px solid #e2e8f0" }}
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={isSubmitting}
                style={{ padding: "12px 24px", borderRadius: "14px", fontSize: "15px", fontWeight: 700, transition: "all 0.2s ease", cursor: "pointer", background: "#212121", color: "white", border: "none", opacity: isSubmitting ? 0.5 : 1 }}
              >
                {isSubmitting ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
