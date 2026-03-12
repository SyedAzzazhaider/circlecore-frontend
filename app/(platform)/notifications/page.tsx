"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Bell, BellOff, Check, CheckCheck, Trash2,
  Loader2, MessageCircle, Heart, ThumbsUp,
  AtSign, Users, Calendar, Pin, Info, Star
} from "lucide-react";
import { notificationsApi, type Notification, type NotificationType } from "@/lib/api/notifications.api";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { useSocket } from "@/lib/context/socket.context";
import Link from "next/link";
import toast from "react-hot-toast";

var TYPE_META: Record<NotificationType, { icon: React.ReactNode; color: string; bg: string }> = {
  comment:          { icon: React.createElement(MessageCircle, { size: 14 }), color: "text-brand-600",   bg: "bg-brand-50"   },
  reply:            { icon: React.createElement(MessageCircle, { size: 14 }), color: "text-brand-600",   bg: "bg-brand-50"   },
  reaction:         { icon: React.createElement(Heart,         { size: 14 }), color: "text-pink-600",    bg: "bg-pink-50"    },
  helpful_vote:     { icon: React.createElement(ThumbsUp,      { size: 14 }), color: "text-emerald-600", bg: "bg-emerald-50" },
  mention:          { icon: React.createElement(AtSign,        { size: 14 }), color: "text-violet-600",  bg: "bg-violet-50"  },
  follow:           { icon: React.createElement(Users,         { size: 14 }), color: "text-sky-600",     bg: "bg-sky-50"     },
  community_invite: { icon: React.createElement(Users,         { size: 14 }), color: "text-indigo-600",  bg: "bg-indigo-50"  },
  event_reminder:   { icon: React.createElement(Calendar,      { size: 14 }), color: "text-amber-600",   bg: "bg-amber-50"   },
  post_pinned:      { icon: React.createElement(Pin,           { size: 14 }), color: "text-orange-600",  bg: "bg-orange-50"  },
  system:           { icon: React.createElement(Info,          { size: 14 }), color: "text-surface-600", bg: "bg-surface-100"}
};

function getNotifHref(n: Notification): string | null {
  if (!n.meta) return null;
  if (n.meta.postId)      return "/posts/" + n.meta.postId;
  if (n.meta.eventId)     return "/events/" + n.meta.eventId;
  if (n.meta.communityId) return "/communities/" + n.meta.communityId;
  return null;
}

function timeAgo(dateStr: string): string {
  var diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  if (diff < 604800) return Math.floor(diff / 86400) + "d ago";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  var [notifications, setNotifications] = useState<Notification[]>([]);
  var [loading,       setLoading]       = useState(true);
  var [loadingMore,   setLoadingMore]   = useState(false);
  var [error,         setError]         = useState("");
  var [page,          setPage]          = useState(1);
  var [hasMore,       setHasMore]       = useState(false);
  var [unreadOnly,    setUnreadOnly]    = useState(false);
  var [unreadCount,   setUnreadCount]   = useState(0);
  var [markingAll,    setMarkingAll]    = useState(false);
  var { socket }                        = useSocket();

  var loadNotifications = useCallback(function(p: number, unread: boolean, replace: boolean) {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    setError("");
    notificationsApi
      .getNotifications(p, unread)
      .then(function(res) {
        var raw  = res.data as any;
        var list: Notification[] = [];
        if (Array.isArray(raw.data?.data))    list = raw.data.data;
        else if (Array.isArray(raw.data))     list = raw.data;
        else if (Array.isArray(raw))          list = raw;

        if (replace) setNotifications(list);
        else         setNotifications(function(prev) { return [...prev, ...list]; });

        var meta = raw.data || raw;
        setHasMore(meta?.totalPages ? p < meta.totalPages : false);
        setUnreadCount(meta?.unreadCount ?? 0);
        setPage(p);
      })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); setLoadingMore(false); });
  }, []);

  useEffect(function() { loadNotifications(1, unreadOnly, true); }, [unreadOnly, loadNotifications]);

  /* Real-time new notifications via socket */
  useEffect(function() {
    if (!socket) return;
    function onNew(n: Notification) {
      setNotifications(function(prev) { return [n, ...prev]; });
      setUnreadCount(function(c) { return c + 1; });
    }
    socket.on("notification:new", onNew);
    return function() { socket.off("notification:new", onNew); };
  }, [socket]);

  async function handleMarkRead(id: string) {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(function(prev) {
        return prev.map(function(n) { return n._id === id ? { ...n, isRead: true } : n; });
      });
      setUnreadCount(function(c) { return Math.max(0, c - 1); });
    } catch(err) { toast.error(getErrorMessage(err)); }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(function(prev) { return prev.map(function(n) { return { ...n, isRead: true }; }); });
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setMarkingAll(false); }
  }

  async function handleDelete(id: string) {
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications(function(prev) { return prev.filter(function(n) { return n._id !== id; }); });
      toast("Notification removed");
    } catch(err) { toast.error(getErrorMessage(err)); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
            <Bell size={18} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 leading-tight flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-600 text-white">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-sm text-surface-500">Stay up to date with your community.</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" loading={markingAll}
            leftIcon={<CheckCheck size={13} />} onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-surface-200 rounded-xl p-1 shadow-card mb-5">
        {[
          { id: false, label: "All" },
          { id: true,  label: "Unread" }
        ].map(function(tab) {
          return (
            <button key={String(tab.id)}
              onClick={function() { setUnreadOnly(tab.id); }}
              className={["flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-150",
                unreadOnly === tab.id ? "bg-brand-600 text-white shadow-sm" : "text-surface-500 hover:bg-surface-100"
              ].join(" ")}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand-500 mb-3" />
          <p className="text-sm text-surface-400">Loading notifications...</p>
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-sm font-semibold text-surface-900 mb-1">Could not load notifications</p>
          <p className="text-xs text-surface-400 mb-4">{error}</p>
          <Button variant="secondary" size="sm" onClick={function() { loadNotifications(1, unreadOnly, true); }}>
            Try again
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <BellOff size={24} className="text-surface-400" />
          </div>
          <p className="text-sm font-semibold text-surface-900 mb-1">
            {unreadOnly ? "No unread notifications" : "No notifications yet"}
          </p>
          <p className="text-xs text-surface-400">
            {unreadOnly ? "You are all caught up!" : "Activity from your communities will appear here."}
          </p>
        </div>
      ) : (
        <div>
          <div className="space-y-2">
            {notifications.map(function(n) {
              var meta = TYPE_META[n.type] || TYPE_META.system;
              var href = getNotifHref(n);

              var content = (
                <div className={"card p-4 transition-all duration-150 " + (!n.isRead ? "border-brand-200 bg-brand-50/30" : "hover:border-surface-300")}>
                  <div className="flex items-start gap-3">
                    <div className={"w-9 h-9 rounded-xl flex items-center justify-center shrink-0 " + meta.bg}>
                      <span className={meta.color}>{meta.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={"text-sm leading-snug " + (!n.isRead ? "font-semibold text-surface-900" : "font-medium text-surface-700")}>
                            {n.title}
                          </p>
                          <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-xs text-surface-400 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!n.isRead && (
                            <button onClick={function(e) { e.preventDefault(); e.stopPropagation(); handleMarkRead(n._id); }}
                              title="Mark as read"
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-400 hover:text-brand-600 hover:bg-white transition-colors">
                              <Check size={13} />
                            </button>
                          )}
                          <button onClick={function(e) { e.preventDefault(); e.stopPropagation(); handleDelete(n._id); }}
                            title="Remove"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-colors">
                            <Trash2 size={13} />
                          </button>
                          {!n.isRead && (
                            <div className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );

              return href
                ? React.createElement(Link, { key: n._id, href: href, onClick: function() { if (!n.isRead) handleMarkRead(n._id); } }, content)
                : React.createElement("div", { key: n._id }, content);
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-5">
              <Button variant="secondary" loading={loadingMore}
                onClick={function() { loadNotifications(page + 1, unreadOnly, false); }}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}