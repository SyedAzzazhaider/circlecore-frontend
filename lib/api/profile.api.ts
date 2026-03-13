import api from "./client";
import type { MembershipTier, ReputationLevel } from "@/lib/types";

export type SocialLinks = {
  twitter?:  string;
  linkedin?: string;
  github?:   string;
};

export type Profile = {
  _id:                  string;
  userId:               string;
  name:                 string;
  email:                string;
  avatar?:              string;
  bio?:                 string;
  location?:            string;
  website?:             string;
  socialLinks?:         SocialLinks;
  skills:               string[];
  interests:            string[];
  reputationScore:      number;
  reputationLevel:      ReputationLevel;
  postCount:            number;
  commentCount:         number;
  eventCount:           number;
  helpfulVotesReceived: number;
  joinedAt:             string;
  isOnboardingComplete: boolean;
  membershipTier:       MembershipTier;
  completenessScore:    number;
  moderatorBadges:      string[];
};

export type ReputationHistory = {
  _id:         string;
  action:      string;
  points:      number;
  description: string;
  createdAt:   string;
};

export type FollowStatus = {
  isFollowing:    boolean;
  followersCount: number;
  followingCount: number;
};

export type UpdateProfilePayload = {
  name?:        string;
  bio?:         string;
  location?:    string;
  website?:     string;
  socialLinks?: SocialLinks;
  skills?:      string[];
  interests?:   string[];
};

export type RecommendedContent = {
  _id:       string;
  title?:    string;
  content:   string;
  type:      string;
  author:    { _id: string; name: string };
  tags:      string[];
  createdAt: string;
};

type ApiResponse<T> = { data: T };

export var profileApi = {
  getProfile: function(userId: string) {
    return api.get<ApiResponse<{ profile: Profile }>>("/profiles/" + userId);
  },

  getMyProfile: function() {
    return api.get<ApiResponse<{ profile: Profile }>>("/profiles/me");
  },

  updateProfile: function(payload: UpdateProfilePayload) {
    return api.put<ApiResponse<{ profile: Profile }>>("/profiles/me", payload);
  },

  uploadAvatar: function(file: File) {
    var formData = new FormData();
    formData.append("avatar", file);
    return api.post<ApiResponse<{ avatarUrl: string }>>(
      "/profiles/me/avatar",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  completeOnboarding: function(payload: {
    bio?:      string;
    location?: string;
    website?:  string;
    skills:    string[];
    interests: string[];
  }) {
    return api.post<ApiResponse<{ profile: Profile }>>("/profiles/me/onboarding", payload);
  },

  getReputationHistory: function(userId: string) {
    return api.get<ApiResponse<ReputationHistory[]>>("/profiles/" + userId + "/reputation");
  },

  getRecommendedContent: function() {
    return api.get<ApiResponse<RecommendedContent[]>>("/feed/recommended");
  },

  voteHelpful: function(postId: string) {
    return api.post<ApiResponse<{ helpfulCount: number }>>("/posts/" + postId + "/helpful", {});
  },

  removeHelpfulVote: function(postId: string) {
    return api.delete<ApiResponse<{ helpfulCount: number }>>("/posts/" + postId + "/helpful");
  },

  /* ── Follow / Unfollow — Gap B-2 ──────────────────────────── */

  followUser: function(userId: string) {
    return api.post<ApiResponse<{ isFollowing: boolean; followersCount: number }>>(
      "/profiles/" + userId + "/follow", {}
    );
  },

  unfollowUser: function(userId: string) {
    return api.delete<ApiResponse<{ isFollowing: boolean; followersCount: number }>>(
      "/profiles/" + userId + "/follow"
    );
  },

  getFollowStatus: function(userId: string) {
    return api.get<ApiResponse<FollowStatus>>(
      "/profiles/" + userId + "/follow-status"
    );
  }
};