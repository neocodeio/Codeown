import { useState } from "react";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";

export default function CreatePost({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { getToken, isLoaded } = useClerkAuth();

  const submit = async () => {
    if (!isLoaded) {
      alert("Please sign in to create a post");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        alert("Please sign in to create a post");
        return;
      }

      console.log("Sending post request with token:", token ? "Token exists" : "No token");

      const response = await api.post(
        "/posts",
        { title: title.trim(), content: content.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Post created successfully:", response.status);
      setTitle("");
      setContent("");
      onCreated();
    } catch (error) {
      console.error("Error creating post:", error);

      // Get detailed error message
      let errorMessage = "Failed to create post";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { error?: string; details?: string; message?: string } } };
        const errorData = axiosError.response?.data;

        if (errorData) {
          if (errorData.details) {
            errorMessage = `${errorData.error || "Failed to create post"}: ${errorData.details}`;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(`Failed to create post: ${errorMessage}`);
    }
  };

  return (
    <div style={{
      backgroundColor: "#ffffff",
      borderRadius: "30px",
      padding: "24px",
      marginBottom: "24px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
      border: "1px solid #e4e7eb",
    }}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post Title"
        style={{
          width: "100%",
          padding: "12px 16px",
          marginBottom: "16px",
          border: "2px solid #e4e7eb",
          borderRadius: "8px",
          fontSize: "18px",
          fontWeight: 600,
          fontFamily: "inherit",
          outline: "none",
          transition: "all 0.2s",
          color: "#000",
          backgroundColor: "#ffffff",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#212121";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(33, 33, 33, 0.1)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#e4e7eb";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        style={{
          width: "100%",
          minHeight: "120px",
          padding: "16px",
          marginBottom: "16px",
          border: "2px solid #e4e7eb",
          borderRadius: "8px",
          fontSize: "16px",
          fontFamily: "inherit",
          resize: "vertical",
          outline: "none",
          transition: "all 0.2s",
          color: "#000",
          backgroundColor: "#ffffff",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#212121";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(33, 33, 33, 0.1)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#e4e7eb";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={submit}
          disabled={!isLoaded || !title.trim() || !content.trim()}
          style={{
            padding: "12px 24px",
            backgroundColor: isLoaded && title.trim() && content.trim() ? "#212121" : "#e4e7eb",
            border: "none",
            color: isLoaded && title.trim() && content.trim() ? "#ffffff" : "#94a3b8",
            borderRadius: "8px",
            cursor: isLoaded && title.trim() && content.trim() ? "pointer" : "not-allowed",
            fontSize: "15px",
            fontWeight: 600,
            transition: "all 0.2s",
            boxShadow: isLoaded && title.trim() && content.trim() ? "0 2px 8px rgba(33, 33, 33, 0.3)" : "none",
          }}
          onMouseEnter={(e) => {
            if (isLoaded && title.trim() && content.trim()) {
              e.currentTarget.style.backgroundColor = "#444";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(33, 33, 33, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (isLoaded && title.trim() && content.trim()) {
              e.currentTarget.style.backgroundColor = "#212121";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(33, 33, 33, 0.3)";
            }
          }}
        >
          {isLoaded ? "Post" : "Sign in to post"}
        </button>
      </div>
    </div>
  );
}