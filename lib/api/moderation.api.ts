import api from "./client";

/* ── Types ────────────────────────────────────────────────────── */
export type FlagReason =
  | "spam" | "harassment" | "hate_speech" | "misinformation"
  | "explicit_content" | "violence" | "off_topic" | "impersonation" | "other";

export type FlagStatus = "pending" | "under_review" | "resolved" | "dismissed";

export type FlagResolution =
  | "no_action" | "content_removed" | "user_warned" | "user_suspended" | "user_banned";

export type ContentType = "post" | "comment" | "user" | "community";

export type WarningSeverity = "minor" | "major" | "final";

export type AuditAction =
  | "flag.reviewed" | "flag.dismissed" | "flag.resolved"
  | "content.removed" | "content.restored"
  | "warning.issued" | "warning.revoked"
  | "user.suspended" | "user.unsuspended"
  | "user.banned" | "user.unbanned"
  | "user.blocked" | "user.unblocked"
  | "user.role_changed" | "community.locked" | "community.unlocked";

export type Flag = {
  _id: string;
  contentType: ContentType;
  contentId: string;
  flaggedBy: { _id: string; name: string; email: string };
  communityId?: string;
  reason: FlagReason;
  description: string;
  status: FlagStatus;
  reviewedBy?: { _id: string; name: string };
  reviewedAt?: string;
  resolution?: FlagResolution;
  resolutionNote?: string;
  createdAt: string;
};

export type Warning = {
  _id: string;
  userId: string;
  issuedBy: { _id: string; name: string };
  communityId?: string;
  reason: string;
  severity: WarningSeverity;
  relatedContentType?: ContentType;
  relatedContentId?: string;
  isActive: boolean;
  expiresAt?: string;
  acknowledgedAt?: string;
  createdAt: string;
};

export type AuditLog = {
  _id: string;
  performedBy: { _id: string; name: string };
  performedByRole: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  communityId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
};

export type ModerationStats = {
  pendingFlags: number;
  resolvedToday: number;
  activeWarnings: number;
  suspendedUsers: number;
  totalFlagsAllTime: number;
  dismissedToday: number;
};

type Paginated<T> = { data: T[]; total: number; page: number; totalPages: number };
type ApiResp<T> = { success: boolean; data: T; message: string };

/* ── API ──────────────────────────────────────────────────────── */
export var moderationApi = {

  /* Flags */
  submitFlag: function(body: {
    contentType: ContentType;
    contentId: string;
    communityId?: string;
    reason: FlagReason;
    description?: string;
  }) {
    return api.post<ApiResp<{ flag: Flag }>>("/moderation/flags", body);
  },

  getReviewQueue: function(params: {
    status?: FlagStatus;
    communityId?: string;
    page?: number;
    limit?: number;
  }) {
    return api.get<ApiResp<Paginated<Flag>>>("/moderation/flags", { params });
  },

  reviewFlag: function(flagId: string, body: {
    status: FlagStatus;
    resolution?: FlagResolution;
    resolutionNote?: string;
  }) {
    return api.patch<ApiResp<{ flag: Flag }>>(`/moderation/flags/${flagId}/review`, body);
  },

  /* Content removal */
  removeContent: function(contentType: ContentType, contentId: string, body: {
    reason: string;
    flagId?: string;
    communityId?: string;
  }) {
    return api.delete<ApiResp<{ message: string }>>(`/moderation/content/${contentType}/${contentId}`, { data: body });
  },

  /* Warnings */
  issueWarning: function(body: {
    userId: string;
    communityId?: string;
    reason: string;
    severity: WarningSeverity;
    relatedContentType?: ContentType;
    relatedContentId?: string;
    flagId?: string;
  }) {
    return api.post<ApiResp<{ warning: Warning }>>("/moderation/warnings", body);
  },

  getUserWarnings: function(userId: string, params?: { page?: number; limit?: number }) {
    return api.get<ApiResp<Paginated<Warning>>>(`/moderation/warnings/${userId}`, { params });
  },

  /* Suspensions */
  suspendUser: function(body: { userId: string; reason: string; suspendedUntil?: string }) {
    return api.post<ApiResp<{ message: string }>>("/moderation/suspend", body);
  },

  unsuspendUser: function(body: { userId: string }) {
    return api.post<ApiResp<{ message: string }>>("/moderation/unsuspend", body);
  },

  /* Community bans */
  banFromCommunity: function(body: {
    userId: string;
    communityId: string;
    reason: string;
    expiresAt?: string;
    flagId?: string;
  }) {
    return api.post<ApiResp<{ ban: object }>>("/moderation/ban", body);
  },

  unbanFromCommunity: function(body: { userId: string; communityId: string }) {
    return api.post<ApiResp<{ message: string }>>("/moderation/unban", body);
  },

  /* User blocks */
  blockUser: function(userId: string) {
    return api.post<ApiResp<{ block: object }>>("/moderation/block", { userId });
  },

  unblockUser: function(userId: string) {
    return api.post<ApiResp<{ message: string }>>("/moderation/unblock", { userId });
  },

  getBlockedUsers: function() {
    return api.get<ApiResp<{ blocks: object[] }>>("/moderation/blocked");
  },

  /* Audit logs */
  getAuditLogs: function(params?: {
    communityId?: string;
    performedBy?: string;
    targetType?: string;
    action?: string;
    page?: number;
    limit?: number;
  }) {
    return api.get<ApiResp<Paginated<AuditLog>>>("/moderation/audit", { params });
  },

  /* Stats */
  getStats: function(communityId?: string) {
    return api.get<ApiResp<{ stats: ModerationStats }>>("/moderation/stats", {
      params: communityId ? { communityId } : {}
    });
  },
};
