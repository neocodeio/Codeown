import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
// import { useTheme } from "./hooks/useTheme";
import Navbar from "./components/Navbar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import FeedbackButton from "./components/FeedbackButton";
import { useTheme } from "./context/ThemeContext";
import logo from "./assets/icon-removebg.png";
import logoWhite from "./assets/logo-white.png";
import MessageNotificationToast from "./components/MessageNotificationToast";
import { ScrollToTop } from "./components/ScrollToTop";
import { useWindowSize } from "./hooks/useWindowSize";
import { useClerkUser } from "./hooks/useClerkUser";
import { useClerkAuth } from "./hooks/useClerkAuth";
import api from "./api/axios";
import { socket } from "./lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { toast as sonnerToast } from "sonner";
import { X } from "phosphor-react";
import "react-toastify/dist/ReactToastify.css";
import { initFavicon, setFaviconDot } from "./utils/favicon";



// Lazy load pages
const Feed = lazy(() => import("./pages/Feed"));
const Landing = lazy(() => import("./pages/Landing"));
const Profile = lazy(() => import("./pages/Profile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const CommentDetail = lazy(() => import("./pages/CommentDetail"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Search = lazy(() => import("./pages/Search"));
const SignInPage = lazy(() => import("./pages/SignIn"));
const SignUpPage = lazy(() => import("./pages/SignUp"));
const Messages = lazy(() => import("./pages/Messages"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const FounderStory = lazy(() => import("./pages/FounderStory"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Changelog = lazy(() => import("./pages/Changelog"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const OurOGs = lazy(() => import("./pages/OurOGs"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const StartupDirectory = lazy(() => import("./pages/StartupDirectory").then(m => ({ default: m.StartupDirectory })));
const StartupProfile = lazy(() => import("./pages/StartupProfile").then(m => ({ default: m.StartupProfile })));
const StartupForm = lazy(() => import("./components/StartupForm").then(m => ({ default: m.StartupForm })));
const UserDirectory = lazy(() => import("./pages/UserDirectory"));
const Sponsorship = lazy(() => import("./pages/Sponsorship"));
// const ShipWeek = lazy(() => import("./pages/ShipWeek"));

// Basic loading fallback
const PageLoader = () => {
  const { theme } = useTheme();
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      width: "100%",
      backgroundColor: "var(--bg-page)",
      animation: "fadeIn 0.5s ease-out"
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px"
      }}>
        <img
          src={theme === "dark" ? logoWhite : logo}
          alt="Codeown"
          style={{
            height: "48px",
            width: "auto",
            animation: "pulse 2s infinite ease-in-out"
          }}
        />
        <div style={{
          width: "40px",
          height: "2px",
          backgroundColor: "var(--border-hairline)",
          position: "relative",
          overflow: "hidden",
          borderRadius: "100px"
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: "50%",
            backgroundColor: "var(--text-primary)",
            animation: "loadingSlide 1.5s infinite ease-in-out"
          }} />
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        @keyframes loadingSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default function App() {
  const isCheckingRef = React.useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 1024; // Standardize mobile breakpoint
  const isDesktop = width >= 1200;
  const { user, isLoaded: userLoaded, isSignedIn } = useClerkUser();
  const { getToken } = useClerkAuth();
  const queryClient = useQueryClient();

  // Global real-time updates
  useEffect(() => {
    const onConnect = () => {
      console.log(`[Socket] Connected: ${socket.id}`);
      if (isSignedIn && user?.id) {
        socket.emit("join", user.id);
      }
    };

    socket.on("connect", onConnect);
    socket.connect();

    // ── Favicon Management ──
    initFavicon();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setFaviconDot(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // ── Referral Detection ──
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("referral_source", ref);
      // Clean up URL for a better experience
      const newParams = new URLSearchParams(location.search);
      newParams.delete("ref");
      const cleanUrl = location.pathname + (newParams.toString() ? "?" + newParams.toString() : "");
      window.history.replaceState({}, "", cleanUrl);
    }

    // In case already connected when hook runs
    if (socket.connected && isSignedIn && user?.id) {
      socket.emit("join", user.id);
    }

    const handleUpdate = ({ type, data }: { type: string, data: any }) => {
      if (type.startsWith("post_") || (type === "comment_liked" && data.type === "post")) {
        if (type === "post_created") {
          window.dispatchEvent(new CustomEvent("postCreated", { detail: data }));
          queryClient.setQueriesData({ queryKey: ["posts"] }, (oldData: any) => {
            if (!oldData || !oldData.pages || oldData.pages.length === 0) return oldData;
            const firstPage = oldData.pages[0];
            const exists = firstPage.posts.some((p: any) => p.id === data.id);
            if (exists) return oldData;
            return {
              ...oldData,
              pages: [
                { ...firstPage, posts: [data, ...firstPage.posts] },
                ...oldData.pages.slice(1)
              ]
            };
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ["posts"] });
          if (data.id || data.postId) {
            queryClient.invalidateQueries({ queryKey: ["post", String(data.id || data.postId)] });
            queryClient.invalidateQueries({ queryKey: ["comments", String(data.id || data.postId)] });
          }
        }
      }
      else if (type.startsWith("project_") || (type === "comment_liked" && data.type === "project")) {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        if (data.id || data.projectId) {
          queryClient.invalidateQueries({ queryKey: ["project", String(data.id || data.projectId)] });
        }
      }
      else if (type === "startup_upvote") {
        queryClient.invalidateQueries({ queryKey: ["startups"] });
        if (data.id) {
          queryClient.invalidateQueries({ queryKey: ["startup", String(data.id)] });
        }
      }
    };

    socket.on("content_update", handleUpdate);

    const handleNewNotification = (notif: { type: string, actorId: string, data?: any }) => {
      queryClient.invalidateQueries({ queryKey: ["unread_count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      // Show red dot on favicon
      setFaviconDot(true);

      if (notif.type === 'startup_upvote') {
        toast(`🚀 Someone upvoted your startup!`, {
          position: "bottom-left",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          theme: "dark"
        });
      }
    };

    socket.on("new_notification", handleNewNotification);

    const handleXPGain = (data: { amount: number, reason: string, newXP: number, newLevel: number }) => {

      // Descriptive minimalist XP toast
      const reasonMap: Record<string, string> = {
        'post': 'for sharing a post',
        'project': 'for launching a project',
        'comment': 'for joining the conversation',
        'like': 'from a social validation (like)',
        'follow': 'for growing your community'
      };

      sonnerToast.custom((t) => (
        <div style={{
          width: '356px',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          fontFamily: 'var(--font-main)',
          fontWeight: 700,
          fontSize: '13px',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✨</span>
            <span>+{data.amount} XP {reasonMap[data.reason] || 'gained'}</span>
          </div>
          <button
            onClick={() => sonnerToast.dismiss(t)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '4px',
              opacity: 0.7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      ), { duration: 5000 });
      // Exponentially faster: Aggressively update all related profile caches for instant visual feedback
      // We target anything that looks like a profile (using partial matching)
      const updateData = (old: any) => {
        if (!old) return old;
        // Verify this cache entry belongs to the user receiving XP
        // Most profile objects have an 'id' or 'username' field
        const isMatch = old.id === user?.id || old.username === user?.username;
        if (!isMatch) return old;

        return {
          ...old,
          xp: data.newXP,
          level: data.newLevel
        };
      };

      if (user?.id) {
        // Update personal profile dashboard
        queryClient.setQueriesData({ queryKey: ["profile"] }, updateData);
        // Update public profile views
        queryClient.setQueriesData({ queryKey: ["userProfile"] }, updateData);
        // Update general user caches (if any)
        queryClient.setQueriesData({ queryKey: ["users"] }, updateData);
      }
    };

    const handleLevelUp = (data: { newLevel: number }) => {
      import("canvas-confetti").then((confetti) => {
        confetti.default({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffffff', '#000000', '#3b82f6']
        });
      });

      sonnerToast.custom((t) => (
        <div style={{
          width: '356px',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          fontFamily: 'var(--font-main)',
          fontWeight: 700,
          fontSize: '13px',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚀</span>
            <span>LEVEL UP! You are now Lvl {data.newLevel}</span>
          </div>
          <button
            onClick={() => sonnerToast.dismiss(t)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '4px',
              opacity: 0.7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      ), { duration: 5000, position: 'top-center' });
    };

    socket.on("xp_gain", handleXPGain);
    socket.on("level_up", handleLevelUp);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      socket.off("connect", onConnect);
      socket.off("content_update", handleUpdate);
      socket.off("new_notification", handleNewNotification);
      socket.off("xp_gain", handleXPGain);
      socket.off("level_up", handleLevelUp);
    };
  }, [queryClient, isSignedIn, user?.id]);

  // Global presence heartbeat
  useEffect(() => {
    let interval: any;
    const pingActivity = async () => {
      if (isSignedIn && user?.id) {
        try {
          await api.post("/users/active/ping");
        } catch (err) { }
      }
    };

    if (isSignedIn && user?.id) {
      pingActivity();
      interval = setInterval(pingActivity, 45000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isSignedIn, user?.id]);

  // Global axios interceptors
  useEffect(() => {
    // Auth Interceptor
    const requestInterceptor = api.interceptors.request.use(async (config) => {
      try {
        const token = await getToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        if (user?.id) config.headers["X-Clerk-User-Id"] = user.id;
      } catch (err) { }
      return config;
    });

    // Rate Limit/Error Interceptor
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          sonnerToast.custom((t) => (
            <div style={{
              width: "356px",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid #ef4444", // Red border for rate limit
              borderRadius: "var(--radius-sm)",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              fontFamily: "var(--font-main)",
              fontWeight: 700,
              fontSize: "13px",
              backdropFilter: "blur(12px)",
              animation: "shake 0.5s cubic-bezier(.36,.07,.19,.97) both",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "18px" }}>🛑</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ color: "#ef4444" }}>Slow down, builder!</span>
                  <span style={{ opacity: 0.7, fontSize: "11px", fontWeight: 500 }}>
                    {error.response.data?.error || "You're sending requests too fast. Please wait a bit."}
                  </span>
                </div>
              </div>
              <button
                onClick={() => sonnerToast.dismiss(t)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  padding: "4px",
                  opacity: 0.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} weight="bold" />
              </button>
              <style>{`
                @keyframes shake {
                  10%, 90% { transform: translate3d(-1px, 0, 0); }
                  20%, 80% { transform: translate3d(2px, 0, 0); }
                  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                  40%, 60% { transform: translate3d(4px, 0, 0); }
                }
              `}</style>
            </div>
          ), {
            id: "rate-limit-toast", // Prevent duplicates
            duration: 4000,
            position: "bottom-right"
          });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [getToken, user?.id]);

  // Onboarding check
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!userLoaded || !isSignedIn || !user?.id || isCheckingRef.current) return;
      try {
        isCheckingRef.current = true;
        const path = location.pathname.split("?")[0].replace(/\/$/, "");
        if (["/onboarding", "/sign-in", "/sign-up", "/forgot-password", "/about-us", "/privacy", "/terms"].includes(path)) return;
        const localStatus = localStorage.getItem(`onboarding_done_${user.id}`);
        if (localStatus === "true") return;
        const token = await getToken();
        if (!token) return;
        const res = await api.get(`/users/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data) {
          if (res.data.onboarding_completed) {
            localStorage.setItem(`onboarding_done_${user.id}`, "true");
          } else if (path !== "/onboarding") {
            navigate("/onboarding", { replace: true });
          }
        }
      } catch (error) { } finally { isCheckingRef.current = false; }
    };
    checkOnboarding();
  }, [userLoaded, isSignedIn, user?.id, navigate]);

  const isAuthRoute = ["/sign-in", "/sign-up", "/forgot-password", "/onboarding"].includes(location.pathname);
  const isLandingPage = (location.pathname === "/" || location.pathname === "" || location.pathname === "/index.html") && !isSignedIn;

  const isStandardPage =
    ["/", "/profile", "/dashboard", "/notifications", "/changelog", "/ogs", "/startups", "/search", "/directory"].includes(location.pathname) ||
    location.pathname.startsWith("/post/") ||
    location.pathname.startsWith("/comment/") ||
    location.pathname.startsWith("/project/") ||
    location.pathname.startsWith("/user/") ||
    (location.pathname !== "/" && !isAuthRoute && location.pathname.split("/").length === 2 && !["search", "billing", "analytics", "leaderboard", "notifications", "messages", "privacy", "terms", "about", "founder-story", "changelog", "startups", "startup", "forgot-password", "sign-in", "sign-up"].includes(location.pathname.split("/")[1]));

  const shouldShowNavbar = (!isAuthRoute && !isLandingPage) || (isMobile && (location.pathname.startsWith("/sign-in") || location.pathname.startsWith("/sign-up")));

  if (!userLoaded) return <PageLoader />;

  return (
    <div
      className="app-fade-in"
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        minHeight: "100vh",
        backgroundColor: "var(--bg-page)",
        justifyContent: (isStandardPage && isDesktop) ? "center" : "flex-start" // Center the whole block (Navbar + Feed)
      }}>
      <ScrollToTop />
      {shouldShowNavbar && <Navbar />}
      <div
        id="main-content"
        style={{
          flex: (isStandardPage && isDesktop) ? (location.pathname.startsWith("/messages") ? "1" : "0 0 920px") : 1,
          width: (isStandardPage && isDesktop) ? (location.pathname.startsWith("/messages") ? "auto" : "920px") : "100%",
          maxWidth: (isStandardPage && isDesktop) ? (location.pathname.startsWith("/messages") ? "100%" : "920px") : "100%",
          position: "relative",
          minWidth: 0,
          paddingTop: isMobile && shouldShowNavbar ? "64px" : "0px",
          paddingBottom: isMobile && shouldShowNavbar ? "80px" : "0px"
        }}
      >
        <div style={{
          maxWidth: "100%",
          width: "100%",
        }}>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* ── Home Route ── */}
                <Route
                  path="/"
                  element={isSignedIn ? <Feed /> : <Landing />}
                />
                <Route path="/search" element={<Search />} />
                <Route path="/post/:id" element={<PostDetail />} />
                <Route path="/comment/:commentId" element={<CommentDetail />} />
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/user/:userId" element={<UserProfile />} />
                <Route path="/sign-in/*" element={<SignInPage />} />
                <Route path="/sign-up/*" element={<SignUpPage />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/billing" element={<Navigate to="/" replace />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/founder-story" element={<FounderStory />} />
                <Route path="/changelog" element={<Changelog />} />
                <Route path="/portfolio/:username" element={<Portfolio />} />
                <Route path="/ogs" element={<OurOGs />} />
                <Route path="/directory" element={<UserDirectory />} />
                <Route path="/startups" element={<StartupDirectory />} />
                <Route path="/startup/new" element={<StartupForm />} />
                <Route path="/startup/:id" element={<StartupProfile />} />
                <Route path="/startup/:id/edit" element={<StartupForm isEditing={true} />} />
                <Route path="/sponsorship" element={<Sponsorship />} />
                <Route path="/ship" element={<Navigate to="/" replace />} />
                <Route path="/:username" element={<UserProfile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
        {!isAuthRoute &&
          location.pathname !== "/messages" &&
          !location.pathname.startsWith("/post/") &&
          !location.pathname.startsWith("/project/") &&
          <FeedbackButton />}
        {!isAuthRoute && <MessageNotificationToast />}
      </div>
    </div>
  );
}
