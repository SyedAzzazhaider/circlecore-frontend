"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2, Sparkles, TrendingUp, Hash,
  Zap, Users, RefreshCw, Flame, Clock,
  Lightbulb, MessageSquare, Rss
} from "lucide-react";
import { feedApi, type Post } from "@/lib/api/feed.api";
import { PostCard }     from "@/components/posts/PostCard";
import { PostComposer } from "@/components/posts/PostComposer";
import { Button }       from "@/components/ui/Button";
import { useSocket }    from "@/lib/context/socket.context";
import { getErrorMessage } from "@/lib/api/client";

var TABS = [
  { id: "latest",     label: "Latest",     icon: Clock      },
  { id: "trending",   label: "Trending",   icon: Flame      },
  { id: "following",  label: "Following",  icon: Users      },
  { id: "unanswered", label: "Unanswered", icon: Lightbulb  }
];

var QUICK_LINKS = [
  { label: "Start a discussion", href: "#",  icon: MessageSquare },
  { label: "Share a resource",   href: "#",  icon: Rss           },
  { label: "Create a poll",      href: "#",  icon: Zap           }
];

function safeArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  var r = raw as Record<string, unknown>;
  if (r && Array.isArray(r.data))                           return r.data as T[];
  if (r && r.data && Array.isArray((r.data as Record<string,unknown>).data)) return (r.data as Record<string,unknown>).data as T[];
  return [];
}

function extractTags(posts: Post[]): { tag: string; count: number }[] {
  var counts: Record<string, number> = {};
  posts.forEach(function(p) {
    (p.tags || []).forEach(function(t) { counts[t] = (counts[t] || 0) + 1; });
  });
  return Object.entries(counts)
    .sort(function(a, b) { return b[1] - a[1]; })
    .slice(0, 8)
    .map(function(e) { return { tag: e[0], count: e[1] }; });
}

export default function FeedPage() {
  var [tab,      setTab]      = useState("latest");
  var [posts,    setPosts]    = useState<Post[]>([]);
  var [loading,  setLoading]  = useState(true);
  var [error,    setError]    = useState("");
  var [page,     setPage]     = useState(1);
  var [hasMore,  setHasMore]  = useState(false);
  var [newPosts, setNewPosts] = useState(0);
  var { socket }              = useSocket();

  var loadPosts = useCallback(function(t: string, p: number, replace: boolean) {
    setLoading(true);
    setError("");
    feedApi.getFeed(t as any, p)
      .then(function(res) {
        var list = safeArray<Post>(res.data);
        if (replace) { setPosts(list); } else { setPosts(function(prev) { return [...prev, ...list]; }); }
        var meta = (res.data as Record<string, unknown>)?.data as Record<string,unknown>;
        setHasMore(meta ? p < ((meta.totalPages as number) || 1) : false);
        setPage(p);
      })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); });
  }, []);

  useEffect(function() { loadPosts(tab, 1, true); }, [tab, loadPosts]);

  useEffect(function() {
    if (!socket) return;
    function onNewPost() { setNewPosts(function(n) { return n + 1; }); }
    socket.on("post:new", onNewPost);
    return function() { socket.off("post:new", onNewPost); };
  }, [socket]);

  function handlePostCreated(post: Post) { setPosts(function(prev) { return [post, ...prev]; }); }
  function handlePostUpdate(updated: Post) {
    setPosts(function(prev) { return prev.map(function(p) { return p._id === updated._id ? updated : p; }); });
  }
  function handlePostDelete(postId: string) {
    setPosts(function(prev) { return prev.filter(function(p) { return p._id !== postId; }); });
  }

  var trendingTags = extractTags(posts);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex gap-6 items-start">

        {/* â”€â”€ MAIN FEED â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex-1 min-w-0 max-w-2xl">

          {/* Composer */}
          <PostComposer onPostCreated={handlePostCreated} />

          {/* New posts banner */}
          {newPosts > 0 && (
            <button
              onClick={function() { setNewPosts(0); loadPosts(tab, 1, true); }}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "#4f46e5"
              }}>
              <Sparkles size={14} />
              {newPosts} new {newPosts === 1 ? "post" : "posts"} â€” click to refresh
              <RefreshCw size={13} />
            </button>
          )}

          {/* Tab bar */}
          <div className="flex items-center gap-1 mt-4 mb-5 bg-white border border-surface-200 rounded-2xl p-1.5 shadow-sm">
            {TABS.map(function(t) {
              var isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={function() { setTab(t.id); }}
                  className={[
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all duration-200",
                    isActive
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-surface-500 hover:text-surface-900 hover:bg-surface-100"
                  ].join(" ")}>
                  <t.icon size={11} />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Feed states */}
          {loading && posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-brand-500" />
              </div>
              <p className="text-sm text-surface-400 font-medium">Loading feed...</p>
            </div>
          ) : error ? (
            <div className="card p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                <Zap size={18} className="text-red-400" />
              </div>
              <p className="text-sm font-bold text-surface-900 mb-1">Could not load feed</p>
              <p className="text-xs text-surface-400 mb-5">{error}</p>
              <Button variant="secondary" size="sm" onClick={function() { loadPosts(tab, 1, true); }}>
                Try again
              </Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="card p-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={22} className="text-brand-400" />
              </div>
              <p className="text-base font-black text-surface-900 mb-1.5 tracking-tight">No posts yet</p>
              <p className="text-sm text-surface-400">Be the first to post something in the community!</p>
            </div>
          ) : (
            <div>
              <div className="space-y-3">
                {posts.map(function(post) {
                  return (
                    <PostCard
                      key={post._id}
                      post={post}
                      onUpdate={handlePostUpdate}
                      onDelete={handlePostDelete}
                    />
                  );
                })}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center mt-6">
                  <Button variant="secondary" loading={loading}
                    onClick={function() { loadPosts(tab, page + 1, false); }}>
                    Load more posts
                  </Button>
                </div>
              )}

              {/* Inline loading */}
              {loading && posts.length > 0 && (
                <div className="flex justify-center py-6">
                  <Loader2 size={18} className="animate-spin text-brand-400" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* â”€â”€ RIGHT SIDEBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="hidden xl:flex flex-col gap-4 w-72 shrink-0 sticky top-6">

          {/* Trending tags */}
          {trendingTags.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center">
                  <TrendingUp size={11} className="text-brand-600" />
                </div>
                <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Trending tags</h3>
              </div>
              <div className="space-y-2">
                {trendingTags.map(function(item) {
                  return (
                    <div key={item.tag} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <Hash size={11} className="text-surface-400 shrink-0" />
                        <span className="text-sm font-semibold text-surface-700 group-hover:text-brand-600 transition-colors cursor-pointer">
                          {item.tag}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Platform stats card */}
          <div className="card p-5"
            style={{ background: "linear-gradient(135deg,#f8f9ff 0%,#f0f2ff 100%)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-brand-100 border border-brand-200 flex items-center justify-center">
                <Zap size={11} className="text-brand-600" />
              </div>
              <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Community</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Posts in feed",  value: posts.length + "+"  },
                { label: "Active tab",     value: tab.charAt(0).toUpperCase() + tab.slice(1) },
                { label: "Real-time",      value: socket ? "Connected" : "Offline" }
              ].map(function(stat) {
                return (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="text-xs text-surface-500 font-medium">{stat.label}</span>
                    <span className={[
                      "text-xs font-black",
                      stat.label === "Real-time"
                        ? socket ? "text-emerald-600" : "text-red-400"
                        : "text-surface-900"
                    ].join(" ")}>{stat.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-4">Quick actions</h3>
            <div className="space-y-1.5">
              {QUICK_LINKS.map(function(link) {
                return (
                  <button key={link.label}
                    onClick={function() {
                      var el = document.querySelector("textarea");
                      if (el) el.focus();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-surface-600 hover:bg-brand-50 hover:text-brand-700 transition-all duration-150 group">
                    <link.icon size={13} className="text-surface-400 group-hover:text-brand-500 transition-colors" />
                    {link.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

