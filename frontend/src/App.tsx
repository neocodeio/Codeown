import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
// import { useTheme } from "./hooks/useTheme";
import Navbar from "./components/Navbar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import FeedbackButton from "./components/FeedbackButton";
import { useWindowSize } from "./hooks/useWindowSize";
import { useClerkUser } from "./hooks/useClerkUser";
import { useClerkAuth } from "./hooks/useClerkAuth";
import api from "./api/axios";
import { socket } from "./lib/socket";
import { useQueryClient } from "@tanstack/react-query";

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
      console.log(`[Socket] Received update: ${type}`, data);
      
      // Post related updates
      if (type.startsWith("post_") || (type === "comment_liked" && data.type === "post")) {
        if (type === "post_created") {
          // Prepend to all active post feeds
          queryClient.setQueriesData({ queryKey: ["posts"] }, (oldData: any) => {
            if (!oldData || !oldData.pages || oldData.pages.length === 0) return oldData;
            
            // Avoid duplicates
            const firstPage = oldData.pages[0];
            const exists = firstPage.posts.some((p: any) => p.id === data.id);
            if (exists) return oldData;

            return {
              ...oldData,
              pages: [
                {
                  ...firstPage,
                  posts: [data, ...firstPage.posts]
                },
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
        if (type === "project_created") {
          // Prepend to all active project feeds
          queryClient.setQueriesData({ queryKey: ["projects"] }, (oldData: any) => {
            if (!oldData || !oldData.pages || oldData.pages.length === 0) return oldData;
            
            // Avoid duplicates
            const firstPage = oldData.pages[0];
            const exists = firstPage.projects.some((p: any) => p.id === data.id);
            if (exists) return oldData;

            return {
              ...oldData,
              pages: [
                {
                  ...firstPage,
                  projects: [data, ...firstPage.projects]
                },
                ...oldData.pages.slice(1)
              ]
            };
          });
        } else {
          // Invalidate for updates/likes/comments
          queryClient.invalidateQueries({ queryKey: ["projects"] });
          if (data.id || data.projectId) {
            queryClient.invalidateQueries({ queryKey: ["project", String(data.id || data.projectId)] });
            queryClient.invalidateQueries({ queryKey: ["project_comments", String(data.id || data.projectId)] });
          }
        }
      }
    };

    socket.on("content_update", handleUpdate);
    
    return () => {
      socket.off("connect", onConnect);
      socket.off("content_update", handleUpdate);
    };
  }, [queryClient, isSignedIn, user?.id]);

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
        if (!token) {
          return;
        }
        const res = await api.get(`/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data && res.data.onboarding_completed === true) {
          // Mark locally so we never check again for this user
          localStorage.setItem(`onboarding_done_${user.id}`, "true");
        } else if (res.data && res.data.onboarding_completed === false) {
          navigate("/onboarding", { replace: true });
        }
        // If onboarding_completed is undefined/missing, do nothing (old user without the field)
      } catch {
        // If API fails, don't redirect — avoid breaking existing users
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

  const layoutDirection = isAuthRoute ? "column" : (isMobile ? "column" : "row");

  return (
    <div style={{
      display: "flex",
      flexDirection: layoutDirection,
      minHeight: "100vh",
      backgroundColor: "var(--bg-page)"
    }}>
      {!isAuthRoute && <Navbar />}
      <div 
        id="main-content"
        style={{
          flex: 1,
          position: "relative",
          minWidth: 0,
          paddingTop: isMobile && !isAuthRoute ? "64px" : "0px",
          paddingBottom: isMobile && !isAuthRoute ? "80px" : "0px"
        }}
      >
        <ErrorBoundary>
          <div key={location.pathname}>
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
      </div>
    </div>
  );
}
