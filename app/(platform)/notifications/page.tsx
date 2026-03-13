"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Bell, BellOff, Check, CheckCheck, Trash2,
  Loader2, MessageCircle, Heart, ThumbsUp,
  AtSign, Users, Calendar, Pin, Info, Sparkles
} from "lucide-react";
import { notificationsApi, type Notification, type NotificationType } from "@/lib/api/notifications.api";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { useSocket } from "@/lib/context/socket.context";
import Link from "next/link";
import toast from "react-hot-toast";

var TYPE_META: Record<NotificationType, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  comment:          { icon: React.createElement(MessageCircle, { size: 14 }), color: "text-brand-600",   bg: "bg-brand-50",   border: "border-brand-100"   },
  reply:            { icon: React.createElement(MessageCircle, { size: 14 }), color: "text-brand-600",   bg: "bg-brand-50",   border: "border-brand-100"   },
  reaction:         { icon: React.createElement(Heart,         { size: 14 }), color: "text-pink-600",    bg: "bg-pink-50",    border: "border-pink-100"    },
  helpful_vote:     { icon: React.createElement(ThumbsUp,      { size: 14 }), color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  mention:          { icon: React.createElement(AtSign,        { size: 14 }), color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-100"  },
  follow:           { icon: React.createElement(Users,         { size: 14 }), color: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-100"     },
  community_invite: { icon: React.createElement(Users,         { size: 14 }), color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-100"  },
  event_reminder:   { icon: React.createElement(Calendar,      { size: 14 }), color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100"   },
  post_pinned:      { icon: React.createElement(Pin,           { size: 14 }), color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-100"  },
  system:           { icon: React.createElement(Info,          { size: 14 }), color: "text-surface-600", bg: "bg-surface-100",border: "border-surface-200" }
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
  if (diff < 60)     return "just now";
  if (diff < 3600)   return Math.floor(diff / 60) + "m ago";
  if (diff < 86400)  return Math.floor(diff / 3600) + "h ago";
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
    notificationsApi.getNotifications(p, unread)
      .then(function(res) {
        var raw  = res.data as any;
        var list: Notification[] = [];
        if (Array.isArray(raw.data?.data))    list = raw.data.data;
        else if (Array.isArray(raw.data))     list = raw.data;
        else if (Array.isArray(raw))          list = raw;
        if (replace) setNotifications(list);
        else setNotifications(function(prev) { return [...prev, ...list]; });
        var meta = raw.data || raw;
        setHasMore(meta?.totalPages ? p < meta.totalPages : false);
        setUnreadCount(meta?.unreadCount ?? 0);
        setPage(p);
      })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); setLoadingMore(false); });
  }, []);

  useEffect(function() { loadNotifications(1, unreadOnly, true); }, [unreadOnly, loadNotifications]);

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
      setNotifications(function(prev) { return prev.map(function(n) { return n._id === id ? { ...n, isRead: true } : n; }); });
      setUnreadCount(function(c) { return Math.max(0, c - 1); });
    } catch(err) { toast.error(getErrorMessage(err)); }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(function(prev) { return prev.map(function(n) { return { ...n, isRead: true }; }); });
      setUnreadCount(0);
      toast.success("All marked as read");
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
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #f0f2ff 0%, #f8fafc 260px)" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl mb-7 px-7 py-6"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", boxShadow: "0 6px 24px rgba(99,102,241,0.3)" }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 relative">
                <Bell size={18} className="text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center"
                    style={{ boxShadow: "0 0 0 2px #4f46e5" }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">Notifications</h1>
                <p className="text-sm text-indigo-200 font-medium">Stay up to date with your community.</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} disabled={markingAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition-all backdrop-blur-sm">
                {markingAll ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 bg-white border border-surface-200 rounded-2xl p-1.5 shadow-card mb-5"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          {[
            { id: false, label: "All notifications",    emoji: "🔔" },
            { id: true,  label: "Unread only",          emoji: "✨" }
          ].map(function(tab) {
            return (
              <button key={String(tab.id)} onClick={function() { setUnreadOnly(tab.id); }}
                className={[
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-150",
                  unreadOnly === tab.id ? "bg-brand-600 text-white shadow-md" : "text-surface-500 hover:bg-surface-100"
                ].join(" ")}>
                <span>{tab.emoji}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4"
              style={{ boxShadow: "0 0 20px rgba(99,102,241,0.15)" }}>
              <Loader2 size={22} className="animate-spin text-brand-500" />
            </div>
            <p className="text-sm font-semibold text-surface-400">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="card p-10 text-center">
            <p className="text-sm font-bold text-surface-900 mb-1">Could not load notifications</p>
            <p className="text-xs text-surface-400 mb-5">{error}</p>
            <Button variant="secondary" size="sm" onClick={function() { loadNotifications(1, unreadOnly, true); }}>Try again</Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-50 flex items-center justify-center mx-auto mb-5 border border-surface-200">
              <BellOff size={24} className="text-surface-400" />
            </div>
            <p className="text-base font-black text-surface-900 mb-1.5">
              {unreadOnly ? "All caught up!" : "No notifications yet"}
            </p>
            <p className="text-sm text-surface-400">
              {unreadOnly ? "You have no unread notifications." : "Activity from your communities will appear here."}
            </p>
          </div>
        ) : (
          <div>
            <div className="space-y-2">
              {notifications.map(function(n) {
                var meta = TYPE_META[n.type] || TYPE_META.system;
                var href = getNotifHref(n);

                var content = (
                  <div className={[
                    "group bg-white border rounded-2xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-surface-900/[0.05]",
                    !n.isRead
                      ? "border-brand-200 bg-gradient-to-r from-brand-50/60 to-white"
                      : "border-surface-200 hover:border-surface-300"
                  ].join(" ")}>
                    <div className="flex items-start gap-3">
                      <div className={[
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                        meta.bg, meta.border
                      ].join(" ")}>
                        <span className={meta.color}>{meta.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className={["text-sm leading-snug", !n.isRead ? "font-bold text-surface-900" : "font-semibold text-surface-700"].join(" ")}>
                              {n.title}
                            </p>
                            <p className="text-xs text-surface-500 mt-1 line-clamp-2 leading-relaxed">{n.body}</p>
                            <p className="text-[10px] text-surface-400 mt-1.5 font-medium">{timeAgo(n.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!n.isRead && (
                              <button onClick={function(e) { e.preventDefault(); e.stopPropagation(); handleMarkRead(n._id); }}
                                title="Mark as read"
                                className="w-7 h-7 flex items-center justify-center rounded-xl text-surface-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                                <Check size={13} />
                              </button>
                            )}
                            <button onClick={function(e) { e.preventDefault(); e.stopPropagation(); handleDelete(n._id); }}
                              title="Remove"
                              className="w-7 h-7 flex items-center justify-center rounded-xl text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        {!n.isRead && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" />
                            <span className="text-[10px] font-bold text-brand-600">New</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );

                return href
                  ? React.createElement(Link, { key: n._id, href, onClick: function() { if (!n.isRead) handleMarkRead(n._id); } }, content)
                  : React.createElement("div", { key: n._id }, content);
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button variant="secondary" loading={loadingMore}
                  onClick={function() { loadNotifications(page + 1, unreadOnly, false); }}>
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
