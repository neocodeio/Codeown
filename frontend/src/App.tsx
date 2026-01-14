import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import PostDetail from "./pages/PostDetail";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/user/:userId" element={<UserProfile />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </>
  );
}