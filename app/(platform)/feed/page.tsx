"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { feedApi, type Post } from "@/lib/api/feed.api";
import { PostCard } from "@/components/posts/PostCard";
import { PostComposer } from "@/components/posts/PostComposer";
import { Button } from "@/components/ui/Button";
import { useSocket } from "@/lib/context/socket.context";
import { getErrorMessage } from "@/lib/api/client";

var TABS = [
  { id: "latest",    label: "Latest"    },
  { id: "trending",  label: "Trending"  },
  { id: "following", label: "Following" },
  { id: "unanswered",label: "Unanswered"}
];

function safeArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  var r = raw as any;
  if (r && Array.isArray(r.data))            return r.data as T[];
  if (r && r.data && Array.isArray(r.data.data)) return r.data.data as T[];
  return [];
}

export default function FeedPage() {
  var [tab,        setTab]        = useState("latest");
  var [posts,      setPosts]      = useState<Post[]>([]);
  var [loading,    setLoading]    = useState(true);
  var [error,      setError]      = useState("");
  var [page,       setPage]       = useState(1);
  var [hasMore,    setHasMore]    = useState(false);
  var [newPosts,   setNewPosts]   = useState(0);
  var { socket }                  = useSocket();

  var loadPosts = useCallback(function(t: string, p: number, replace: boolean) {
    setLoading(true);
    setError("");
    feedApi
      .getFeed({ sort: t, page: p, limit: 20 })
      .then(function(res) {
        var list = safeArray<Post>(res.data);
        if (replace) { setPosts(list); } else { setPosts(function(prev) { return [...prev, ...list]; }); }
        var meta = (res.data as any)?.data;
        setHasMore(meta ? p < (meta.totalPages || 1) : false);
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

  function handlePostCreated(post: Post) {
    setPosts(function(prev) { return [post, ...prev]; });
  }

  function handlePostUpdate(updated: Post) {
    setPosts(function(prev) { return prev.map(function(p) { return p._id === updated._id ? updated : p; }); });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      <PostComposer onPostCreated={handlePostCreated} />

      {newPosts > 0 && (
        <button
          onClick={function() { setNewPosts(0); loadPosts(tab, 1, true); }}
          className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-50 border border-brand-200 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition-all"
        >
          <Sparkles size={14} />
          {newPosts} new post{newPosts > 1 ? "s" : ""} — click to refresh
        </button>
      )}

      <div className="flex items-center gap-1 mt-4 mb-5 bg-white border border-surface-200 rounded-xl p-1 shadow-card">
        {TABS.map(function(t) {
          var isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={function() { setTab(t.id); }}
              className={[
                "flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-150",
                isActive ? "bg-brand-600 text-white shadow-sm" : "text-surface-500 hover:text-surface-900 hover:bg-surface-100"
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {loading && posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand-500 mb-3" />
          <p className="text-sm text-surface-400">Loading feed...</p>
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-sm font-semibold text-surface-900 mb-1">Could not load feed</p>
          <p className="text-xs text-surface-400 mb-4">{error}</p>
          <Button variant="secondary" size="sm" onClick={function() { loadPosts(tab, 1, true); }}>Try again</Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">✨</p>
          <p className="text-sm font-semibold text-surface-900 mb-1">No posts yet</p>
          <p className="text-xs text-surface-400">Be the first to post something!</p>
        </div>
      ) : (
        <div>
          <div className="space-y-4">
            {posts.map(function(post) {
              return <PostCard key={post._id} post={post} onUpdate={handlePostUpdate} />;
            })}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button variant="secondary" loading={loading} onClick={function() { loadPosts(tab, page + 1, false); }}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
