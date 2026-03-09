"use client";

import React, { useEffect, useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { feedApi, type Post } from "@/lib/api/feed.api";
import { PostCard } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/lib/api/client";

export default function SavedPostsPage() {
  var [posts, setPosts]     = useState<Post[]>([]);
  var [loading, setLoading] = useState(true);
  var [error, setError]     = useState("");
  var [page, setPage]       = useState(1);
  var [hasMore, setHasMore] = useState(false);

  function loadSaved(p: number, replace: boolean) {
    setLoading(true);
    feedApi
      .getSavedPosts(p)
      .then(function(res) {
        var data = res.data.data;
        if (replace) { setPosts(data.data); } else { setPosts(function(prev) { return [...prev, ...data.data]; }); }
        setHasMore(p < data.totalPages);
        setPage(p);
      })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); });
  }

  useEffect(function() { loadSaved(1, true); }, []);

  function handleUnsave(postId: string) {
    setPosts(function(prev) { return prev.filter(function(p) { return p._id !== postId; }); });
  }

  return React.createElement(
    "div",
    { className: "max-w-2xl mx-auto px-4 py-6" },
    React.createElement("div", { className: "flex items-center gap-2.5 mb-6" },
      React.createElement(Bookmark, { size: 20, className: "text-brand-600" }),
      React.createElement("h1", { className: "text-2xl font-bold text-surface-900" }, "Saved posts")
    ),
    loading && posts.length === 0 ? (
      React.createElement("div", { className: "flex justify-center py-16" }, React.createElement(Loader2, { size: 28, className: "animate-spin text-brand-500" }))
    ) : error ? (
      React.createElement("div", { className: "card p-8 text-center" },
        React.createElement("p", { className: "text-sm text-surface-500 mb-3" }, error),
        React.createElement(Button, { variant: "secondary", size: "sm", onClick: function() { loadSaved(1, true); } }, "Try again")
      )
    ) : posts.length === 0 ? (
      React.createElement("div", { className: "card p-12 text-center" },
        React.createElement("p", { className: "text-4xl mb-3" }, "🔖"),
        React.createElement("p", { className: "text-sm font-semibold text-surface-900 mb-1" }, "No saved posts yet"),
        React.createElement("p", { className: "text-xs text-surface-400" }, "Tap the bookmark icon on any post to save it here.")
      )
    ) : (
      React.createElement("div", { className: "space-y-3" },
        posts.map(function(post) {
          return React.createElement(PostCard, { key: post._id, post: post, onDelete: handleUnsave });
        }),
        hasMore && React.createElement("div", { className: "flex justify-center pt-2" },
          React.createElement(Button, { variant: "secondary", loading: loading, onClick: function() { loadSaved(page + 1, false); } }, "Load more")
        )
      )
    )
  );
}
