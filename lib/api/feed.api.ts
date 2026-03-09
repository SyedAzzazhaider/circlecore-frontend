import api from "./client";

export type PostType = "text" | "poll" | "resource" | "file";

export type PollOption = {
  _id: string;
  text: string;
  voteCount: number;
  hasVoted: boolean;
};

export type Reaction = {
  emoji: string;
  count: number;
  hasReacted: boolean;
};

export type Post = {
  _id: string;
  type: PostType;
  title?: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatarUrl?: string;
    reputationLevel: string;
    role?: string;
  };
  community?: { _id: string; name: string; slug: string };
  channel?:   { _id: string; name: string };
  tags: string[];
  mediaURLs: string[];
  reactions: Reaction[];
  commentCount: number;
  viewCount: number;
  helpfulCount: number;
  hasVotedHelpful: boolean;
  isSaved: boolean;
  isPinned: boolean;
  isLocked: boolean;
  pollOptions?: PollOption[];
  resourceUrl?: string;
  resourceTitle?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatarUrl?: string;
    reputationLevel: string;
  };
  postId: string;
  parentId?: string;
  replies: Comment[];
  reactions: Reaction[];
  isEdited: boolean;
  createdAt: string;
};

export type FeedFilter = "latest" | "trending" | "following" | "unanswered";

export type CreatePostPayload = {
  type: PostType;
  title?: string;
  content: string;
  communityId?: string;
  channelId?: string;
  tags?: string[];
  pollOptions?: string[];
  resourceUrl?: string;
  resourceTitle?: string;
};

export type CreateCommentPayload = {
  content: string;
  postId: string;
  parentId?: string;
};

type ApiResponse<T> = { data: T };
type PaginatedResponse<T> = { data: T[]; total: number; page: number; totalPages: number };

export var feedApi = {
  getFeed: function(filter: FeedFilter, page: number, tag?: string) {
    var url = "/posts?filter=" + filter + "&page=" + page + "&limit=20";
    if (tag) url += "&tag=" + encodeURIComponent(tag);
    return api.get<ApiResponse<PaginatedResponse<Post>>>(url);
  },

  getPost: function(postId: string) {
    return api.get<ApiResponse<Post>>("/posts/" + postId);
  },

  createPost: function(payload: CreatePostPayload) {
    return api.post<ApiResponse<Post>>("/posts", payload);
  },

  uploadPostMedia: function(file: File) {
    var formData = new FormData();
    formData.append("media", file);
    return api.post<ApiResponse<{ url: string; name: string; size: number }>>(
      "/posts/upload-media",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  updatePost: function(postId: string, payload: Partial<CreatePostPayload>) {
    return api.put<ApiResponse<Post>>("/posts/" + postId, payload);
  },

  deletePost: function(postId: string) {
    return api.delete("/posts/" + postId);
  },

  reactToPost: function(postId: string, emoji: string) {
    return api.post<ApiResponse<Post>>("/posts/" + postId + "/react", { emoji: emoji });
  },

  voteHelpful: function(postId: string) {
    return api.post<ApiResponse<{ helpfulCount: number }>>("/posts/" + postId + "/helpful", {});
  },

  removeHelpfulVote: function(postId: string) {
    return api.delete<ApiResponse<{ helpfulCount: number }>>("/posts/" + postId + "/helpful");
  },

  savePost: function(postId: string) {
    return api.post<ApiResponse<{ saved: boolean }>>("/posts/" + postId + "/save", {});
  },

  unsavePost: function(postId: string) {
    return api.delete<ApiResponse<{ saved: boolean }>>("/posts/" + postId + "/save");
  },

  getSavedPosts: function(page: number) {
    return api.get<ApiResponse<PaginatedResponse<Post>>>("/posts/saved?page=" + page + "&limit=20");
  },

  pinPost: function(postId: string) {
    return api.post("/posts/" + postId + "/pin", {});
  },

  lockPost: function(postId: string) {
    return api.post("/posts/" + postId + "/lock", {});
  },

  votePoll: function(postId: string, optionId: string) {
    return api.post<ApiResponse<Post>>("/posts/" + postId + "/vote", { optionId: optionId });
  },

  getComments: function(postId: string) {
    return api.get<ApiResponse<Comment[]>>("/posts/" + postId + "/comments");
  },

  createComment: function(payload: CreateCommentPayload) {
    return api.post<ApiResponse<Comment>>("/comments", payload);
  },

  reactToComment: function(commentId: string, emoji: string) {
    return api.post<ApiResponse<Comment>>("/comments/" + commentId + "/react", { emoji: emoji });
  },

  deleteComment: function(commentId: string) {
    return api.delete("/comments/" + commentId);
  },

  searchPosts: function(query: string, filter: string, page: number) {
    return api.get<ApiResponse<PaginatedResponse<Post>>>(
      "/posts/search?q=" + encodeURIComponent(query) + "&filter=" + filter + "&page=" + page + "&limit=20"
    );
  }
};
