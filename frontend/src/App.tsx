import { Routes, Route } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import Navbar from "./components/Navbar";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import PostDetail from "./pages/PostDetail";
import Search from "./pages/Search";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import { ErrorBoundary } from "./components/ErrorBoundary";
import FeedbackButton from "./components/FeedbackButton";

export default function App() {
  const { toggleTheme } = useTheme();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f6f6f6" }}>
      <Navbar onToggleTheme={toggleTheme} />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/search" element={<Search />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </ErrorBoundary>
      <FeedbackButton />
    </div>
  );
}