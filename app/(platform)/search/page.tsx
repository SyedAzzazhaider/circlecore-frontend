"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { feedApi, type Post } from "@/lib/api/feed.api";
import { PostCard } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/lib/api/client";

var FILTER_TABS = [
  { id: "latest",   label: "Latest"   },
  { id: "trending", label: "Trending" }
];

function SearchPageInner() {
  var searchParams = useSearchParams();
  var router       = useRouter();

  var [query, setQuery]   = useState(searchParams.get("q") || "");
  var [tag, setTag]       = useState(searchParams.get("tag") || "");
  var [filter, setFilter] = useState("latest");
  var [posts, setPosts]   = useState<Post[]>([]);
  var [loading, setLoading]     = useState(false);
  var [error, setError]         = useState("");
  var [hasSearched, setHasSearched] = useState(false);
  var [page, setPage]       = useState(1);
  var [hasMore, setHasMore] = useState(false);
  var [totalResults, setTotalResults] = useState(0);

  var inputRef = React.useRef<HTMLInputElement>(null);

  var doSearch = useCallback(function(q: string, t: string, f: string, p: number, replace: boolean) {
    var effectiveQuery = q.trim() || (t ? "#" + t : "");
    if (!effectiveQuery) return;

    setLoading(true);
    setError("");
    setHasSearched(true);

    feedApi
      .searchPosts(q.trim(), f, p)
      .then(function(res) {
        var data = res.data.data;
        if (replace) {
          setPosts(data.data);
        } else {
          setPosts(function(prev) { return [...prev, ...data.data]; });
        }
        setTotalResults(data.total);
        setHasMore(p < data.totalPages);
        setPage(p);
      })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); });
  }, []);

  /* Auto-search on tag param */
  useEffect(function() {
    var t = searchParams.get("tag") || "";
    var q = searchParams.get("q")   || "";
    setTag(t);
    setQuery(q);
    if (t || q) {
      doSearch(q, t, filter, 1, true);
    }
  }, [searchParams, doSearch, filter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() && !tag) return;
    var params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (tag)          params.set("tag", tag);
    router.push("/search?" + params.toString());
    doSearch(query, tag, filter, 1, true);
  }

  function clearTag() {
    setTag("");
    router.push("/search" + (query ? "?q=" + encodeURIComponent(query) : ""));
  }

  function handlePostDelete(postId: string) {
    setPosts(function(prev) { return prev.filter(function(p) { return p._id !== postId; }); });
    setTotalResults(function(n) { return Math.max(0, n - 1); });
  }

  return React.createElement(
    "div",
    { className: "max-w-2xl mx-auto px-4 py-6" },

    /* Search header */
    React.createElement(
      "div",
      { className: "mb-6" },
      React.createElement("h1", { className: "text-2xl font-bold text-surface-900 mb-4" }, "Search"),
      React.createElement(
        "form",
        { onSubmit: handleSearch, className: "flex gap-2" },
        React.createElement(
          "div",
          { className: "relative flex-1" },
          React.createElement(Search, { size: 15, className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" }),
          React.createElement("input", {
            ref: inputRef,
            value: query,
            onChange: function(e: React.ChangeEvent<HTMLInputElement>) { setQuery(e.target.value); },
            placeholder: "Search posts, topics, keywords...",
            className: "input pl-10 pr-4",
            autoFocus: true,
            maxLength: 200
          })
        ),
        React.createElement(Button, { type: "submit", loading: loading }, "Search")
      ),

      /* Active tag filter */
      tag && React.createElement(
        "div",
        { className: "flex items-center gap-2 mt-3" },
        React.createElement("span", { className: "text-xs text-surface-500 font-medium" }, "Filtering by tag:"),
        React.createElement(
          "span",
          { className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200" },
          "#" + tag,
          React.createElement(
            "button",
            { type: "button", onClick: clearTag, className: "text-brand-400 hover:text-brand-700 transition-colors" },
            React.createElement(X, { size: 11 })
          )
        )
      )
    ),

    /* Filter tabs */
    hasSearched && React.createElement(
      "div",
      { className: "flex items-center gap-1 mb-5 bg-white border border-surface-200 rounded-xl p-1 shadow-card" },
      FILTER_TABS.map(function(tab) {
        return React.createElement(
          "button",
          {
            key: tab.id,
            onClick: function() { setFilter(tab.id); doSearch(query, tag, tab.id, 1, true); },
            className: ["flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-150",
              filter === tab.id ? "bg-brand-600 text-white shadow-sm" : "text-surface-500 hover:text-surface-900 hover:bg-surface-100"
            ].join(" ")
          },
          tab.label
        );
      })
    ),

    /* Results */
    loading && posts.length === 0 ? (
      React.createElement("div", { className: "flex flex-col items-center justify-center py-20" },
        React.createElement(Loader2, { size: 28, className: "animate-spin text-brand-500 mb-3" }),
        React.createElement("p", { className: "text-sm text-surface-400" }, "Searching...")
      )
    ) : error ? (
      React.createElement("div", { className: "card p-8 text-center" },
        React.createElement("p", { className: "text-sm font-semibold text-surface-900 mb-1" }, "Search failed"),
        React.createElement("p", { className: "text-xs text-surface-400 mb-4" }, error),
        React.createElement(Button, { variant: "secondary", size: "sm", onClick: function() { doSearch(query, tag, filter, 1, true); } }, "Try again")
      )
    ) : hasSearched && posts.length === 0 ? (
      React.createElement("div", { className: "card p-12 text-center" },
        React.createElement("p", { className: "text-3xl mb-3" }, "🔍"),
        React.createElement("p", { className: "text-sm font-semibold text-surface-900 mb-1" }, "No results found"),
        React.createElement("p", { className: "text-xs text-surface-400" }, "Try different keywords or remove filters.")
      )
    ) : hasSearched ? (
      React.createElement(
        "div",
        null,
        React.createElement(
          "p",
          { className: "text-xs text-surface-400 font-medium mb-4" },
          totalResults + " result" + (totalResults !== 1 ? "s" : "")
        ),
        React.createElement(
          "div",
          { className: "space-y-3" },
          posts.map(function(post) {
            return React.createElement(PostCard, { key: post._id, post: post, onDelete: handlePostDelete });
          }),
          hasMore && React.createElement(
            "div",
            { className: "flex justify-center pt-2" },
            React.createElement(Button, { variant: "secondary", loading: loading, onClick: function() { doSearch(query, tag, filter, page + 1, false); } }, "Load more")
          )
        )
      )
    ) : (
      React.createElement(
        "div",
        { className: "text-center py-16" },
        React.createElement("p", { className: "text-4xl mb-3" }, "🔎"),
        React.createElement("p", { className: "text-sm font-semibold text-surface-900 mb-1" }, "Search CircleCore"),
        React.createElement("p", { className: "text-xs text-surface-400" }, "Find posts by keyword, topic, or hashtag.")
      )
    )
  );
}

export default function SearchPage() {
  return (
    <React.Suspense fallback={null}>
      <SearchPageInner />
    </React.Suspense>
  );
}
