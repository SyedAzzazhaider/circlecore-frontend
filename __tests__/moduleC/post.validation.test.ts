import { createPostSchema, createCommentSchema } from "@/lib/validations/post";

describe("createPostSchema", () => {
  var V = { type: "text" as const, content: "Hello world" };

  it("passes — valid text post",          () => expect(createPostSchema.safeParse(V).success).toBe(true));
  it("passes — valid poll post",          () => expect(createPostSchema.safeParse({ type: "poll", content: "Vote now", pollOptions: ["Yes", "No"] }).success).toBe(true));
  it("passes — valid resource post",      () => expect(createPostSchema.safeParse({ type: "resource", content: "Check this", resourceUrl: "https://example.com" }).success).toBe(true));
  it("passes — valid file post",          () => expect(createPostSchema.safeParse({ type: "file", content: "See attached" }).success).toBe(true));
  it("fails — empty content",             () => expect(createPostSchema.safeParse({ type: "text", content: "" }).success).toBe(false));
  it("fails — content over 10000 chars",  () => expect(createPostSchema.safeParse({ type: "text", content: "x".repeat(10001) }).success).toBe(false));
  it("fails — too many tags",             () => expect(createPostSchema.safeParse({ ...V, tags: ["a","b","c","d","e","f"] }).success).toBe(false));
  it("passes — exactly 5 tags",           () => expect(createPostSchema.safeParse({ ...V, tags: ["a","b","c","d","e"] }).success).toBe(true));
  it("fails — invalid resource URL",      () => expect(createPostSchema.safeParse({ type: "resource", content: "test", resourceUrl: "not-a-url" }).success).toBe(false));
  it("fails — poll with 1 option",        () => expect(createPostSchema.safeParse({ type: "poll", content: "test", pollOptions: ["Only one"] }).success).toBe(false));
  it("fails — poll over 6 options",       () => expect(createPostSchema.safeParse({ type: "poll", content: "test", pollOptions: ["a","b","c","d","e","f","g"] }).success).toBe(false));
});

describe("createCommentSchema", () => {
  it("passes — valid comment",            () => expect(createCommentSchema.safeParse({ content: "Nice post!" }).success).toBe(true));
  it("fails — empty comment",             () => expect(createCommentSchema.safeParse({ content: "" }).success).toBe(false));
  it("fails — comment over 2000 chars",   () => expect(createCommentSchema.safeParse({ content: "x".repeat(2001) }).success).toBe(false));
  it("passes — exactly 2000 chars",       () => expect(createCommentSchema.safeParse({ content: "x".repeat(2000) }).success).toBe(true));
});
