import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
// import { useTheme } from "./hooks/useTheme";
import Navbar from "./components/Navbar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import FeedbackButton from "./components/FeedbackButton";
import MessageNotificationToast from "./components/MessageNotificationToast";
import { useWindowSize } from "./hooks/useWindowSize";
import { useClerkUser } from "./hooks/useClerkUser";
import { useClerkAuth } from "./hooks/useClerkAuth";
import api from "./api/axios";
import { socket } from "./lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Lazy load pages
const Feed = lazy(() => import("./pages/Feed"));
const Profile = lazy(() => import("./pages/Profile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
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
const Billing = lazy(() => import("./pages/Billing"));
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

// Basic loading fallback
const PageLoader = () => (
  <div style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100%",
    backgroundColor: "var(--bg-page)"
  }}>
    <div style={{
      width: "24px",
      height: "24px",
      border: "0.5px solid var(--border-hairline)",
      borderTopColor: "var(--text-primary)",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite"
    }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;
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

    // In case already connected when hook runs
    if (socket.connected && isSignedIn && user?.id) {
      socket.emit("join", user.id);
    }

    const handleUpdate = ({ type, data }: { type: string, data: any }) => {
      // Post related updates
      if (type.startsWith("post_") || (type === "comment_liked" && data.type === "post")) {
        if (type === "post_created") {
          // Prepend to all active post feeds
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
          // Invalidate for updates/likes/comments
          queryClient.invalidateQueries({ queryKey: ["posts"] });
          if (data.id || data.postId) {
            queryClient.invalidateQueries({ queryKey: ["post", String(data.id || data.postId)] });
            queryClient.invalidateQueries({ queryKey: ["comments", String(data.id || data.postId)] });
          }
        }
      } 
      
      // Project related updates
      else if (type.startsWith("project_") || (type === "comment_liked" && data.type === "project")) {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        if (data.id || data.projectId) {
          queryClient.invalidateQueries({ queryKey: ["project", String(data.id || data.projectId)] });
        }
      }
      
      // Startup related updates
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
      
      // Show toast
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
    
    return () => {
      socket.off("connect", onConnect);
      socket.off("content_update", handleUpdate);
      socket.off("new_notification", handleNewNotification);
    };
  }, [queryClient, isSignedIn, user?.id]);

  // Global presence heartbeat
  useEffect(() => {
    let interval: any;

    const pingActivity = async () => {
      if (isSignedIn && user?.id) {
        try {
          await api.post("/users/active/ping");
        } catch (err) {
          // Fail silently for pings
        }
      }
    };

    if (isSignedIn && user?.id) {
      // Initial ping
      pingActivity();
      // Periodic pings every 45s
      interval = setInterval(pingActivity, 45000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSignedIn, user?.id]);

  // Globalaxios interceptor for auth
  useEffect(() => {
    const interceptor = api.interceptors.request.use(async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("Error setting auth header:", err);
      }
      return config;
    });

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [getToken]);

  // Check onboarding status for signed-in users
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!userLoaded || !isSignedIn || !user?.id) {
        return;
      }

      // Don't redirect if already on onboarding or auth pages
      if (
        location.pathname === "/onboarding" ||
        location.pathname.startsWith("/sign-in") ||
        location.pathname.startsWith("/sign-up") ||
        location.pathname.startsWith("/forgot-password")
      ) {
        return;
      }

      // Skip check if already marked as completed locally
      const localFlag = localStorage.getItem(`onboarding_done_${user.id}`);
      if (localFlag === "true") {
        return;
      }

      try {
        const token = await getToken();
        if (!token) return;

        const res = await api.get(`/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.data) {
          if (res.data.onboarding_completed === true) {
            localStorage.setItem(`onboarding_done_${user.id}`, "true");
          } else {
            navigate("/onboarding", { replace: true });
          }
        }
      } catch (err: any) {
        // If user not found (404), they likely haven't started onboarding yet
        if (err.response?.status === 404) {
          navigate("/onboarding", { replace: true });
        }
      }
    };

    checkOnboarding();
  }, [userLoaded, isSignedIn, user?.id, location.pathname]);

  const isAuthRoute =
    location.pathname.startsWith("/sign-in") ||
    location.pathname.startsWith("/sign-up") ||
    location.pathname.startsWith("/forgot-password") ||
    location.pathname.startsWith("/portfolio") ||
    location.pathname === "/onboarding";

  const isStandardPage = 
    location.pathname === "/" || 
    location.pathname === "/profile" || 
    location.pathname === "/dashboard" ||
    location.pathname === "/notifications" || 
    location.pathname === "/changelog" || 
    location.pathname.startsWith("/post/") ||
    location.pathname.startsWith("/project/") ||
    location.pathname.startsWith("/user/") || 
    (location.pathname !== "/" && !isAuthRoute && location.pathname.split("/").length === 2 && !["search", "billing", "analytics", "leaderboard", "notifications", "messages", "privacy", "terms", "about", "founder-story", "changelog", "startups", "startup"].includes(location.pathname.split("/")[1]));

  const layoutDirection = isAuthRoute ? "column" : (isMobile ? "column" : "row");

  const shouldShowNavbar = !isAuthRoute || (isMobile && (location.pathname.startsWith("/sign-in") || location.pathname.startsWith("/sign-up")));

  return (
    <div style={{
      display: "flex",
      flexDirection: layoutDirection,
      minHeight: "100vh",
      backgroundColor: "var(--bg-page)",
      justifyContent: (isStandardPage && isDesktop) ? "center" : "flex-start"
    }}>
      {shouldShowNavbar && <Navbar />}
      <div 
        id="main-content"
        style={{
          flex: (isStandardPage && isDesktop) ? "0 0 1020px" : 1,
          width: (isStandardPage && isDesktop) ? "1020px" : "100%",
          maxWidth: "100%",
          position: "relative",
          minWidth: 0,
          paddingTop: isMobile && shouldShowNavbar ? "64px" : "0px",
          paddingBottom: isMobile && shouldShowNavbar ? "80px" : "0px"
        }}
      >
        <ErrorBoundary>
          <div>
            <Suspense fallback={<PageLoader />}>
              <Routes location={location}>
                <Route path="/" element={<Feed />} />
                <Route path="/search" element={<Search />} />
                <Route path="/post/:id" element={<PostDetail />} />
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/user/:userId" element={<UserProfile />} />
                <Route path="/sign-in/*" element={<SignInPage />} />
                <Route path="/sign-up/*" element={<SignUpPage />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/billing" element={<Billing />} />
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
                <Route path="/startups" element={<StartupDirectory />} />
                <Route path="/startup/new" element={<StartupForm />} />
                <Route path="/startup/:id" element={<StartupProfile />} />
                <Route path="/startup/:id/edit" element={<StartupForm isEditing={true} />} />
                <Route path="/:username" element={<UserProfile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </ErrorBoundary>
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
