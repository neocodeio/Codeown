import { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
// import { useTheme } from "./hooks/useTheme";
import Navbar from "./components/Navbar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import FeedbackButton from "./components/FeedbackButton";
import ConnectionStatus from "./components/ConnectionStatus";
import { useWindowSize } from "./hooks/useWindowSize";

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

// Basic loading fallback
const PageLoader = () => (
  <div style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100%"
  }}>
    <div className="spinner" style={{
      width: "32px",
      height: "32px",
      border: "3px solid #f3f3f3",
      borderTop: "3px solid #212121",
      borderRadius: "50%",
      animation: "spin 1s linear infinite"
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
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const isAuthRoute =
    location.pathname.startsWith("/sign-in") ||
    location.pathname.startsWith("/sign-up") ||
    location.pathname.startsWith("/forgot-password");

  const layoutDirection = isAuthRoute ? "column" : (isMobile ? "column" : "row");

  return (
    <div style={{
      display: "flex",
      flexDirection: layoutDirection,
      minHeight: "100vh",
      backgroundColor: "#F8FAFC"
    }}>
      {!isAuthRoute && <Navbar />}
      <div style={{
        flex: 1,
        position: "relative",
        minWidth: 0,
        overflowX: "hidden",
        paddingTop: isMobile && !isAuthRoute ? "64px" : "0px",
        paddingBottom: isMobile && !isAuthRoute ? "80px" : "0px"
      }}>
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
                <Route path="/profile" element={<Profile />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/founder-story" element={<FounderStory />} />
                <Route path="/:username" element={<UserProfile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </ErrorBoundary>
        {!isAuthRoute && location.pathname !== "/messages" && <FeedbackButton />}
        {!isAuthRoute && <ConnectionStatus />}
      </div>
    </div>
  );
}
