import { api } from "./api";
import type { Comment, Paginated, Post, Reply, User, Visibility } from "../types";

export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const { data } = await api.post("/auth/register", input);
  return data.data as { user: User; accessToken: string };
}

export async function login(input: { email: string; password: string }) {
  const { data } = await api.post("/auth/login", input);
  return data.data as { user: User; accessToken: string };
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me");
  return data.data.user as User;
}

export async function refreshSession() {
  const { data } = await api.post("/auth/refresh");
  return data.data as { user: User; accessToken: string };
}

export async function fetchFeed(params: { cursor?: string; limit?: number }) {
  const { data } = await api.get("/posts", { params });
  return data.data as Paginated<Post>;
}

export async function fetchPost(id: string) {
  const { data } = await api.get(`/posts/${id}`);
  return data.data.post as Post;
}

export async function createPost(input: {
  content: string;
  visibility: Visibility;
  image?: File | null;
}) {
  const form = new FormData();
  form.append("content", input.content);
  form.append("visibility", input.visibility);
  if (input.image) form.append("image", input.image);
  const { data } = await api.post("/posts", form);
  return data.data.post as Post;
}

export async function deletePost(id: string) {
  await api.delete(`/posts/${id}`);
}

export async function fetchComments(
  postId: string,
  params: { cursor?: string; limit?: number },
) {
  const { data } = await api.get(`/posts/${postId}/comments`, { params });
  return data.data as Paginated<Comment>;
}

export async function createComment(postId: string, content: string) {
  const { data } = await api.post(`/posts/${postId}/comments`, { content });
  return data.data.comment as Comment;
}

export async function createReply(commentId: string, content: string) {
  const { data } = await api.post(`/comments/${commentId}/replies`, { content });
  return data.data.reply as Reply;
}

export async function fetchReplies(
  commentId: string,
  params: { cursor?: string; limit?: number },
) {
  const { data } = await api.get(`/comments/${commentId}/replies`, { params });
  return data.data as Paginated<Reply>;
}

export async function addLike(targetType: "POST" | "COMMENT" | "REPLY", targetId: string) {
  const { data } = await api.post("/likes", { targetType, targetId });
  return data.data as { liked: boolean; likeCount: number; likers: import("../types").Author[] };
}

export async function removeLike(
  targetType: "POST" | "COMMENT" | "REPLY",
  targetId: string,
) {
  const { data } = await api.delete("/likes", { data: { targetType, targetId } });
  return data.data as { liked: boolean; likeCount: number; likers: import("../types").Author[] };
}

export async function fetchLikers(
  targetType: "POST" | "COMMENT" | "REPLY",
  targetId: string,
  limit = 100,
) {
  const { data } = await api.get("/likes", { params: { targetType, targetId, limit } });
  return data.data.likers as import("../types").Author[];
}
