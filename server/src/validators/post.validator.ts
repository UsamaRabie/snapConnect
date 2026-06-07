import { z } from "zod";

const parseArray = (val: unknown) => {
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return val.split(",").map((s) => s.trim()).filter(Boolean); }
  }
  if (Array.isArray(val)) return val;
  return undefined;
};

export const createPostSchema = z.object({
  body: z.object({
    caption: z
      .string()
      .max(2200, "Caption must be at most 2200 characters")
      .optional(),
    location: z.string().max(100).optional(),
    tags: z.preprocess(parseArray, z.array(z.string().max(30)).max(30)).optional(),
    taggedUsers: z.preprocess(parseArray, z.array(z.string()).max(30)).optional(),
  }),
});

export const updatePostSchema = z.object({
  body: z.object({
    caption: z
      .string()
      .max(2200, "Caption must be at most 2200 characters")
      .optional(),
    location: z.string().max(100).optional(),
    tags: z
      .array(z.string().max(30))
      .max(30, "Maximum 30 tags allowed")
      .optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Post ID is required"),
  }),
});
