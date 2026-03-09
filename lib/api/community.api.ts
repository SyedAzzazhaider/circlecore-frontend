import api from "./client";

export type Channel = {
  _id: string;
  name: string;
  description?: string;
  type: "text" | "announcement" | "resource";
  postCount: number;
  isPrivate: boolean;
};

export type Community = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  coverImageUrl?: string;
  iconUrl?: string;
  memberCount: number;
  postCount: number;
  channels: Channel[];
  tags: string[];
  isPrivate: boolean;
  isMember: boolean;
  isPending: boolean;
  role?: "member" | "moderator" | "admin";
  createdAt: string;
};

type ApiResponse<T> = { data: T };

export var communityApi = {
  getCommunities: function(page: number) {
    return api.get<ApiResponse<Community[]>>("/communities?page=" + page + "&limit=20");
  },

  getCommunity: function(slug: string) {
    return api.get<ApiResponse<Community>>("/communities/" + slug);
  },

  joinCommunity: function(communityId: string) {
    return api.post<ApiResponse<{ message: string }>>("/communities/" + communityId + "/join", {});
  },

  leaveCommunity: function(communityId: string) {
    return api.post<ApiResponse<{ message: string }>>("/communities/" + communityId + "/leave", {});
  },

  getCommunityFeed: function(slug: string, channelId: string | null, page: number) {
    var url = "/communities/" + slug + "/posts?page=" + page + "&limit=20";
    if (channelId) { url += "&channelId=" + channelId; }
    return api.get<ApiResponse<{ posts: import("./feed.api").Post[]; total: number }>>(url);
  }
};
