import { Routes, Route, useLocation } from "react-router-dom";
// import { useTheme } from "./hooks/useTheme";
import Navbar from "./components/Navbar";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import PostDetail from "./pages/PostDetail";
import ProjectDetail from "./pages/ProjectDetail";
import Search from "./pages/Search";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import Messages from "./pages/Messages";
import ForgotPassword from "./pages/ForgotPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AboutUs from "./pages/AboutUs";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "./components/ErrorBoundary";
import FeedbackButton from "./components/FeedbackButton";
import ConnectionStatus from "./components/ConnectionStatus";


export default function App() {
  const location = useLocation();

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Navbar />
      <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
        <ErrorBoundary>
          <div key={location.pathname} className="page-enter">
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
              <Route path="/messages" element={<Messages />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </ErrorBoundary>
        {location.pathname !== "/messages" && <FeedbackButton />}
        <ConnectionStatus />
      </div>
    </div>
  );
}