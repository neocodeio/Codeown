import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../lib/socket";

export default function SocketListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    // POST EVENTS
    socket.on("post_created", () => {
      console.log("[Socket] Post created, invalidating post queries");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    });

    socket.on("post_updated", (data) => {
      console.log("[Socket] Post updated:", data.id);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", String(data.id || data)] });
    });

    socket.on("post_deleted", () => {
      console.log("[Socket] Post deleted, invalidating post queries");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    });

    socket.on("post_liked", (data) => {
      console.log("[Socket] Post liked:", data.postId);
      queryClient.invalidateQueries({ queryKey: ["post-likes", data.postId] });
      // Also update the posts list to reflect new like count if cached
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    });

    // PROJECT EVENTS
    socket.on("project_created", () => {
      console.log("[Socket] Project created, invalidating project queries");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    });

    socket.on("project_updated", (data) => {
      console.log("[Socket] Project updated:", data.id);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", String(data.id || data)] });
    });

    socket.on("project_deleted", () => {
      console.log("[Socket] Project deleted, invalidating project queries");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    });

    socket.on("project_liked", (data) => {
      console.log("[Socket] Project liked:", data.projectId);
      queryClient.invalidateQueries({ queryKey: ["project-like-status", String(data.projectId)] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    });

    // COMMENT EVENTS
    socket.on("comment_created", (data) => {
      console.log("[Socket] Comment created on post:", data.postId);
      queryClient.invalidateQueries({ queryKey: ["comments", String(data.postId)] });
    });

    socket.on("project_comment_created", (data) => {
      console.log("[Socket] Project comment created:", data.projectId);
      queryClient.invalidateQueries({ queryKey: ["project-comments", String(data.projectId)] });
    });

    socket.on("project_comment_updated", (data) => {
      console.log("[Socket] Project comment updated:", data.projectId);
      queryClient.invalidateQueries({ queryKey: ["project-comments", String(data.projectId)] });
    });

    socket.on("project_comment_deleted", (data) => {
      console.log("[Socket] Project comment deleted:", data.projectId);
      queryClient.invalidateQueries({ queryKey: ["project-comments", String(data.projectId)] });
    });

    return () => {
      socket.off("post_created");
      socket.off("post_updated");
      socket.off("post_deleted");
      socket.off("post_liked");
      socket.off("project_created");
      socket.off("project_updated");
      socket.off("project_deleted");
      socket.off("project_liked");
      socket.off("comment_created");
      socket.off("project_comment_created");
      socket.off("project_comment_updated");
      socket.off("project_comment_deleted");
    };
  }, [queryClient]);

  return null;
}
