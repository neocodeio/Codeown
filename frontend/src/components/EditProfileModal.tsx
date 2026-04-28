import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import { updateAvatarCache } from "../hooks/useAvatar";
import { validateImageSize } from "../constants/upload";
import { Camera, InstagramLogo, GithubLogo, TwitterLogo, LinkedinLogo, Link } from "phosphor-react";

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
    instagram_url?: string | null;
    website_url?: string | null;
    banner_url?: string | null;
    work_experience?: Array<{
      company: string;
      role: string;
      start_date: string;
      end_date: string;
      description: string;
    }> | null;
    education?: Array<{
      school: string;
      degree: string;
      start_date: string;
      end_date: string;
      description?: string;
    }> | null;
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
  const [instagramUrl, setInstagramUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isHirable, setIsHirable] = useState(false);
  const [workExperience, setWorkExperience] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
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
      setInstagramUrl(currentUser.instagram_url || "");
      setWebsiteUrl(currentUser.website_url || "");
      setSkills(currentUser.skills || []);
      setSkillInput("");
      setAvatarFile(null);
      setBannerFile(null);
      setBannerPreview(currentUser.banner_url || null);
      setUsernameError(null);
      setIsHirable(currentUser.is_hirable ?? false);
      setWorkExperience(currentUser.work_experience || []);
      setEducation(currentUser.education || []);
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
  
  const handleAddWork = () => {
    setWorkExperience([...workExperience, { company: "", role: "", start_date: "", end_date: "", description: "" }]);
  };

  const handleUpdateWork = (index: number, field: string, value: string) => {
    const updated = [...workExperience];
    updated[index] = { ...updated[index], [field]: value };
    setWorkExperience(updated);
  };

  const handleRemoveWork = (index: number) => {
    setWorkExperience(workExperience.filter((_, i) => i !== index));
  };

  const handleAddEducation = () => {
    setEducation([...education, { school: "", degree: "", start_date: "", end_date: "" }]);
  };

  const handleUpdateEducation = (index: number, field: string, value: string) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
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

    // Check username length
    if (username.trim().length > 0 && username.trim().length < 8) {
      setUsernameError("Username must be at least 8 characters long.");
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
          instagram_url: instagramUrl.trim() || null,
          website_url: websiteUrl.trim() || null,
          job_title: jobTitle.trim() || null,
          location: location.trim() || null,
          skills: skills.length > 0 ? skills : null,
          is_hirable: isHirable,
          work_experience: workExperience.filter(w => w.company.trim() || w.role.trim()),
          education: education.filter(e => e.school.trim() || e.degree.trim()),
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
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // If the error is related to username, show it under the input, otherwise alert
      if (
        errorMessage.includes("14 days") ||
        errorMessage.toLowerCase().includes("taken") ||
        errorMessage.toLowerCase().includes("8 characters")
      ) {
        setUsernameError(errorMessage);
      } else {
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
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3000,
        backdropFilter: "blur(8px)",
      }}>
        <div
          style={{
            width: "100%",
            maxWidth: isMobile ? "100%" : "600px",
            height: isMobile ? "100dvh" : "auto",
            maxHeight: isMobile ? "100dvh" : "90vh",
            margin: 0,
            backgroundColor: "var(--bg-page)",
            borderRadius: isMobile ? "0" : "var(--radius-lg)",
            boxShadow: "none",
            border: isMobile ? "none" : "0.5px solid var(--border-hairline)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ 
            padding: isMobile ? "20px" : "32px 40px", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            borderBottom: "0.5px solid var(--border-hairline)", 
            flexShrink: 0 // Prevent header from shrinking
          }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>Edit profile</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", color: "var(--text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}>&times;</button>
          </div>

          <div style={{ 
            padding: isMobile ? "24px 20px" : "40px", 
            overflowY: "auto", 
            display: "flex", 
            flexDirection: "column", 
            gap: "32px",
            flex: 1,
            minHeight: 0 // Crucial for flexbox scroll behavior
          }}>
            {/* Avatar Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-tertiary)" }}>Avatar</label>
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <label style={{ cursor: "pointer", position: "relative" }}>
                  <div style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "var(--radius-sm)",
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
                    fontWeight: 600,
                    border: "2px solid var(--bg-page)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                  }}>
                    <Camera size={16} weight="bold" />
                  </div>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
                </label>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)", fontSize: "11px" }}>Change avatar</p>
                  <p style={{ margin: "4px 0 0" }}>Minimalist square profile. 2px radius.</p>
                </div>
              </div>
            </div>

            {/* Banner Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-tertiary)" }}>Profile banner</label>
              <label style={{ cursor: "pointer", position: "relative", width: "100%" }}>
                <div style={{
                  width: "100%",
                  height: "120px",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  border: "0.5px solid var(--border-hairline)",
                  backgroundColor: "var(--bg-hover)",
                  position: "relative"
                }}>
                  {bannerPreview ? (
                    <img src={bannerPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Banner Preview" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontSize: "13px", fontWeight: 500 }}>
                      No banner
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
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}
                  >
                    Change banner
                  </div>
                </div>
                <input type="file" accept="image/*" onChange={handleBannerChange} style={{ display: "none" }} />
              </label>
              <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 500 }}>Recommended size: 1500x500px</span>
            </div>

            {/* Form Fields */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "12px" }}>Display name</label>
              <input style={{ width: "100%", padding: "14px 18px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "14px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "12px" }}>
                Username
                {!canChange && (
                  <span style={{ color: "var(--text-tertiary)", float: "right", fontSize: "11px", fontWeight: 500 }}>Locked for 14d</span>
                )}
              </label>
              <input
                style={{ width: "100%", padding: "14px 18px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "14px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setUsernameError(null); }}
                disabled={!canChange && username === currentUser.username}
                placeholder="Username"
              />
              {usernameError && <p style={{ color: "#ef4444", fontSize: "11px", marginTop: "8px", fontWeight: 500 }}>{usernameError}</p>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "12px" }}>Job title</label>
              <input style={{ width: "100%", padding: "14px 18px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "14px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Full stack developer" />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "12px" }}>Location</label>
              <input style={{ width: "100%", padding: "14px 18px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "14px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. San Francisco, CA" />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "12px" }}>Bio</label>
              <textarea
                style={{ width: "100%", padding: "14px 18px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "14px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box", resize: "none", lineHeight: 1.6 }}
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community who you are"
              />
            </div>

            <div style={{ borderTop: "0.5px solid var(--border-hairline)", paddingTop: "12px" }}>
              <span style={{ display: "block", fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px" }}>Social links</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "8px" }}>
                    <GithubLogo size={14} weight="bold" /> GitHub URL
                  </label>
                  <input style={{ width: "100%", padding: "12px 16px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "13px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
                </div>
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "8px" }}>
                    <TwitterLogo size={14} weight="bold" /> Twitter (X) URL
                  </label>
                  <input style={{ width: "100%", padding: "12px 16px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "13px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} type="url" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://twitter.com/..." />
                </div>
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "8px" }}>
                    <InstagramLogo size={14} weight="bold" /> Instagram URL
                  </label>
                  <input style={{ width: "100%", padding: "12px 16px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "13px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "8px" }}>
                    <LinkedinLogo size={14} weight="bold" /> LinkedIn URL
                  </label>
                  <input style={{ width: "100%", padding: "12px 16px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "13px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/..." />
                </div>
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "8px" }}>
                    <Link size={14} weight="bold" /> Personal website
                  </label>
                  <input style={{ width: "100%", padding: "12px 16px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "13px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
            </div>

            {/* Career & Education Timeline */}
            <div style={{ borderTop: "0.5px solid var(--border-hairline)", paddingTop: "32px" }}>
              <span style={{ display: "block", fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px" }}>Professional Timeline</span>
              
              {/* Work Experience Editor */}
              <div style={{ marginBottom: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-tertiary)" }}>Work Experience</label>
                  <button type="button" onClick={handleAddWork} style={{ background: "none", border: "none", color: "var(--text-primary)", fontSize: "12px", fontWeight: 700, cursor: "pointer", padding: "4px 8px" }}>+ Add work</button>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {workExperience.map((work, index) => (
                    <div key={index} style={{ padding: "20px", background: "rgba(255,255,255,0.02)", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", display: "flex", flexDirection: "column", gap: "16px", position: "relative" }}>
                      <button onClick={() => handleRemoveWork(index)} style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", color: "#ef4444", fontSize: "18px", cursor: "pointer", padding: "4px" }}>&times;</button>
                      
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "6px" }}>Company</label>
                          <input style={{ width: "100%", padding: "10px 14px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "13px", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} value={work.company} onChange={(e) => handleUpdateWork(index, "company", e.target.value)} placeholder="e.g. Google" />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "6px" }}>Role</label>
                          <input style={{ width: "100%", padding: "10px 14px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "13px", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} value={work.role} onChange={(e) => handleUpdateWork(index, "role", e.target.value)} placeholder="e.g. Senior Frontend Dev" />
                        </div>
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "6px" }}>Start Year</label>
                          <input style={{ width: "100%", padding: "10px 14px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "13px", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} value={work.start_date} onChange={(e) => handleUpdateWork(index, "start_date", e.target.value)} placeholder="e.g. 2021" />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "6px" }}>End Year</label>
                          <input style={{ width: "100%", padding: "10px 14px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "13px", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} value={work.end_date} onChange={(e) => handleUpdateWork(index, "end_date", e.target.value)} placeholder="e.g. Present" />
                        </div>
                      </div>
                      
                      <div>
                        <label style={{ display: "block", fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "6px" }}>Description</label>
                        <textarea style={{ width: "100%", padding: "10px 14px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "13px", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box", resize: "none" }} rows={2} value={work.description} onChange={(e) => handleUpdateWork(index, "description", e.target.value)} placeholder="Short summary of your impact" />
                      </div>
                    </div>
                  ))}
                  {workExperience.length === 0 && <p style={{ fontSize: "12px", color: "var(--text-tertiary)", fontStyle: "italic" }}>No work history added.</p>}
                </div>
              </div>

              {/* Education Editor */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-tertiary)" }}>Education</label>
                  <button type="button" onClick={handleAddEducation} style={{ background: "none", border: "none", color: "var(--text-primary)", fontSize: "12px", fontWeight: 700, cursor: "pointer", padding: "4px 8px" }}>+ Add education</button>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {education.map((edu, index) => (
                    <div key={index} style={{ padding: "20px", background: "rgba(255,255,255,0.02)", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", display: "flex", flexDirection: "column", gap: "16px", position: "relative" }}>
                      <button onClick={() => handleRemoveEducation(index)} style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", color: "#ef4444", fontSize: "18px", cursor: "pointer", padding: "4px" }}>&times;</button>
                      
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "6px" }}>Institution</label>
                          <input style={{ width: "100%", padding: "10px 14px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "13px", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} value={edu.school} onChange={(e) => handleUpdateEducation(index, "school", e.target.value)} placeholder="e.g. Stanford University" />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "6px" }}>Degree</label>
                          <input style={{ width: "100%", padding: "10px 14px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "13px", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} value={edu.degree} onChange={(e) => handleUpdateEducation(index, "degree", e.target.value)} placeholder="e.g. B.S. Computer Science" />
                        </div>
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "6px" }}>Start Year</label>
                          <input style={{ width: "100%", padding: "10px 14px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "13px", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} value={edu.start_date} onChange={(e) => handleUpdateEducation(index, "start_date", e.target.value)} placeholder="e.g. 2017" />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "6px" }}>End Year</label>
                          <input style={{ width: "100%", padding: "10px 14px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "13px", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} value={edu.end_date} onChange={(e) => handleUpdateEducation(index, "end_date", e.target.value)} placeholder="e.g. 2021" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {education.length === 0 && <p style={{ fontSize: "12px", color: "var(--text-tertiary)", fontStyle: "italic" }}>No education history added.</p>}
                </div>
              </div>
            </div>

            <div style={{ borderTop: "0.5px solid var(--border-hairline)", paddingTop: "32px" }}>
              <label style={{ display: "block", fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px" }}>Tech stack & skills</label>
              <form onSubmit={handleAddSkill} style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                <input
                  style={{ flex: 1, width: "100%", padding: "14px 18px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontSize: "14px", transition: "all 0.15s ease", background: "var(--bg-hover)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add skill (e.g. React)"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  style={{ padding: "0 24px", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 600, transition: "all 0.15s ease", cursor: "pointer", background: "transparent", color: "var(--text-tertiary)", border: "0.5px solid var(--border-hairline)" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
                >
                  Add
                </button>
              </form>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {skills.map((skill) => (
                  <div key={skill} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--bg-hover)", color: "var(--text-primary)", padding: "8px 14px", borderRadius: "var(--radius-sm)", fontSize: "11px", fontWeight: 600, border: "0.5px solid var(--border-hairline)", cursor: "default" }}>
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
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontStyle: "italic", padding: "4px", fontWeight: 500 }}>
                    No skills added.
                  </div>
                )}
              </div>
            </div>

            {/* Pro: Open to Opportunities */}
            <div style={{ borderTop: "0.5px solid var(--border-hairline)", paddingTop: "32px", marginBottom: "8px" }}>
              {currentUser.is_pro === true && (
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "24px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>Open to opportunities</label>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                      Indicate that you are open to new professional opportunities.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "16px" }}>
                      <p style={{ margin: 0, fontSize: "11px", color: (projectCount ?? 0) > 0 ? "var(--text-primary)" : "var(--text-tertiary)", fontWeight: 600 }}>
                        {(projectCount ?? 0) > 0 ? "[✓]" : "[ ]"} Projects
                      </p>
                      <p style={{ margin: 0, fontSize: "11px", color: skills.length > 0 ? "var(--text-primary)" : "var(--text-tertiary)", fontWeight: 600 }}>
                        {skills.length > 0 ? "[✓]" : "[ ]"} Skills
                      </p>
                      <p style={{ margin: 0, fontSize: "11px", color: bio.trim().length > 0 ? "var(--text-primary)" : "var(--text-tertiary)", fontWeight: 600 }}>
                        {bio.trim().length > 0 ? "[✓]" : "[ ]"} Bio
                      </p>
                    </div>
                  </div>
                  <div
                    onClick={() => canToggleOpenToOpportunities && setIsHirable(!isHirable)}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "var(--radius-sm)",
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

          </div>

          {/* Action Buttons - Fixed Footer */}
          <div style={{ 
            padding: isMobile ? "16px 20px calc(16px + env(safe-area-inset-bottom))" : "24px 40px", 
            backgroundColor: "var(--bg-page)", 
            borderTop: "0.5px solid var(--border-hairline)", 
            display: "flex", 
            flexDirection: "row",
            gap: "10px", 
            justifyContent: "flex-end",
            zIndex: 10,
            flexShrink: 0 // Prevent footer from shrinking
          }}>
            <button
              onClick={onClose}
              style={{ 
               padding: isMobile ? "12px 16px" : "14px 24px", 
                borderRadius: "var(--radius-sm)", 
                fontSize: "13px", 
                fontWeight: 600, 
                transition: "all 0.15s ease", 
                cursor: "pointer", 
                background: "transparent", 
                color: "var(--text-tertiary)", 
                border: "0.5px solid var(--border-hairline)", 
                flex: isMobile ? 1 : "none"
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={isSubmitting}
              style={{ 
                padding: isMobile ? "12px 16px" : "14px 32px", 
                borderRadius: "var(--radius-sm)", 
                fontSize: "13px", 
                fontWeight: 600, 
                transition: "all 0.15s ease", 
                cursor: "pointer", 
                background: "var(--text-primary)", 
                color: "var(--bg-page)", 
                border: "none", 
                opacity: isSubmitting ? 0.3 : 1, 
                flex: isMobile ? 1 : "none"
              }}
            >
              {isSubmitting ? "Saving..." : (isMobile ? "Save" : "Save changes")}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
