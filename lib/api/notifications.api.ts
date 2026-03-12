import api from "./client";

export type NotificationType =
  | "comment"
  | "reply"
  | "reaction"
  | "helpful_vote"
  | "mention"
  | "follow"
  | "community_invite"
  | "event_reminder"
  | "post_pinned"
  | "system";

export type Notification = {
  _id:       string;
  type:      NotificationType;
  title:     string;
  body:      string;
  isRead:    boolean;
  actor?: {
    _id:    string;
    name:   string;
    avatar?: string;
  };
  meta?: {
    postId?:      string;
    commentId?:   string;
    communityId?: string;
    eventId?:     string;
  };
  createdAt: string;
};

type ApiResponse<T> = { data: T };
type PaginatedResponse<T> = { data: T[]; total: number; page: number; totalPages: number; unreadCount: number };

export var notificationsApi = {
  getNotifications: function(page: number, unreadOnly?: boolean) {
    var url = "/notifications?page=" + page + "&limit=20";
    if (unreadOnly) url += "&unread=true";
    return api.get<ApiResponse<PaginatedResponse<Notification>>>(url);
  },

  getUnreadCount: function() {
    return api.get<ApiResponse<{ count: number }>>("/notifications/unread-count");
  },

  markAsRead: function(notificationId: string) {
    return api.put<ApiResponse<Notification>>("/notifications/" + notificationId + "/read", {});
  },

  markAllAsRead: function() {
    return api.put<ApiResponse<{ updated: number }>>("/notifications/read-all", {});
  },

  deleteNotification: function(notificationId: string) {
    return api.delete("/notifications/" + notificationId);
  },

  clearAll: function() {
    return api.delete("/notifications/clear-all");
  }
};