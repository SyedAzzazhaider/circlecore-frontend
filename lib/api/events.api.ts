import api from "./client";

export type EventType   = "webinar" | "meetup" | "room";
export type EventStatus = "upcoming" | "live" | "past";
export type EventFilter = "upcoming" | "live" | "past";

export type CCEvent = {
  _id: string; title: string; details: string; type: EventType; status: EventStatus;
  communityId?: string;
  community?: { _id: string; name: string; slug: string };
  organizer: { _id: string; name: string; avatarUrl?: string };
  startDate: string; endDate: string; location?: string; meetingUrl?: string;
  maxAttendees?: number; rsvpCount: number; hasRsvped: boolean; reminderSet: boolean;
  isPrivate: boolean; coverImageUrl?: string; tags: string[]; createdAt: string;
};

export type CreateEventPayload = {
  title: string; details: string; type: EventType;
  startDate: string; endDate: string;
  location?: string; meetingUrl?: string;
  maxAttendees?: number; isPrivate?: boolean;
  tags?: string[]; communityId?: string;
};

type ApiResponse<T> = { data: T };
type PaginatedResponse<T> = { data: T[]; total: number; page: number; totalPages: number };

export var eventsApi = {
  getEvents: function(filter: EventFilter, type: string, page: number) {
    var url = "/events?filter=" + filter + "&page=" + page + "&limit=20";
    if (type && type !== "all") url += "&type=" + encodeURIComponent(type);
    return api.get<ApiResponse<PaginatedResponse<CCEvent>>>(url);
  },

  getEvent: function(eventId: string) {
    return api.get<ApiResponse<CCEvent>>("/events/" + eventId);
  },

  createEvent: function(payload: CreateEventPayload) {
    return api.post<ApiResponse<CCEvent>>("/events", payload);
  },

  updateEvent: function(eventId: string, payload: Partial<CreateEventPayload>) {
    return api.put<ApiResponse<CCEvent>>("/events/" + eventId, payload);
  },

  deleteEvent: function(eventId: string) {
    return api.delete("/events/" + eventId);
  },

  rsvp: function(eventId: string) {
    return api.post<ApiResponse<{ rsvpCount: number; hasRsvped: boolean }>>("/events/" + eventId + "/rsvp", {});
  },

  cancelRsvp: function(eventId: string) {
    return api.delete<ApiResponse<{ rsvpCount: number; hasRsvped: boolean }>>("/events/" + eventId + "/rsvp");
  },

  setReminder: function(eventId: string) {
    return api.post<ApiResponse<{ reminderSet: boolean }>>("/events/" + eventId + "/reminder", {});
  },

  removeReminder: function(eventId: string) {
    return api.delete<ApiResponse<{ reminderSet: boolean }>>("/events/" + eventId + "/reminder");
  }
};