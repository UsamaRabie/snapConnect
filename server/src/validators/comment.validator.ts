import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.object({
    text: z
      .string()
      .min(1, "Comment cannot be empty")
      .max(500, "Comment must be at most 500 characters"),
    parentComment: z.string().optional(),
  }),
});

export const updateCommentSchema = z.object({
  body: z.object({
    text: z
      .string()
      .min(1, "Comment cannot be empty")
      .max(500, "Comment must be at most 500 characters"),
  }),
  params: z.object({
    id: z.string().min(1),
    commentId: z.string().min(1),
  }),
});
