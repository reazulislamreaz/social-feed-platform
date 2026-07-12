export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};

export type Author = {
  id: string;
  firstName: string;
  lastName: string;
};

export type Visibility = "PUBLIC" | "PRIVATE";
export type LikeTargetType = "POST" | "COMMENT" | "REPLY";

export type Post = {
  id: string;
  content: string;
  imageUrl: string | null;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  author: Author;
  likeCount: number;
  likedByMe: boolean;
  likers: Author[];
  commentCount: number;
};

export type Reply = {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
  likeCount: number;
  likedByMe: boolean;
  likers: Author[];
};

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
  likeCount: number;
  likedByMe: boolean;
  likers: Author[];
  replyCount: number;
  replies: Reply[];
};

export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
};

export type ApiError = {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
};
