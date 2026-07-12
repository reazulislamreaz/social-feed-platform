import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().trim().email().max(255).toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const createPostSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  visibility: z
    .enum(["PUBLIC", "PRIVATE"])
    .or(z.literal(""))
    .optional()
    .transform((v) => (v === "PRIVATE" ? "PRIVATE" : "PUBLIC")),
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const createReplySchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const likeSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "REPLY"]),
  targetId: z.string().min(1),
});

export const feedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const commentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});
