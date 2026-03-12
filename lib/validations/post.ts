import { z } from "zod";

export var createPostSchema = z.object({
  type: z.enum(["text", "poll", "resource", "file"]),
  title: z.string().max(200, "Title too long").optional().or(z.literal("")),
  content: z
    .string()
    .min(1, "Post content is required")
    .max(10000, "Content cannot exceed 10,000 characters"),
  tags: z.array(z.string().max(30)).max(5, "Maximum 5 tags").optional(),
  pollOptions: z
    .array(z.string().min(1).max(100))
    .min(2, "Add at least 2 options")
    .max(6, "Maximum 6 poll options")
    .optional(),
  resourceUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  resourceTitle: z.string().max(200).optional().or(z.literal(""))
});
export type CreatePostFormData = z.infer<typeof createPostSchema>;

export var createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2,000 characters")
});
export type CreateCommentFormData = z.infer<typeof createCommentSchema>;