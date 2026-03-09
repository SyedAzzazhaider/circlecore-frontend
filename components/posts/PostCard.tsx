"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageCircle, Eye, Pin, Lock,
  ExternalLink, MoreHorizontal,
  Trash2, Flag, Bookmark, BookmarkCheck,
  ThumbsUp, FileText, PinIcon
} from "lucide-react";
import { type Post, feedApi } from "@/lib/api/feed.api";
import { useAuthStore } from "@/lib/store/auth.store";
import { ModeratorBadge } from "@/components/profile/ModeratorBadge";
import { getInitials, getAvatarColor, formatCount } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/client";
import toast from "react-hot-toast";

var REACTION_EMOJIS = ["👍", "❤️", "🔥", "💡", "👏"];

type PostCardProps = {
  post: Post;
  onDelete?: (postId: string) => void;
  onUpdate?: (post: Post) => void;
};

export function PostCard({ post, onDelete, onUpdate }: PostCardProps) {
  var { user } = useAuthStore();
  var router   = useRouter();

  var [menuOpen, setMenuOpen]         = useState(false);
  var [reacting, setReacting]         = useState(false);
  var [saving, setSaving]             = useState(false);
  var [voting, setVoting]             = useState(false);
  var [isSaved, setIsSaved]           = useState(post.isSaved);
  var [helpfulCount, setHelpfulCount] = useState(post.helpfulCount);
  var [hasVotedHelpful, setHasVotedHelpful] = useState(post.hasVotedHelpful);

  var isOwner    = user && user._id === post.author._id;
  var isModerator = user && (user.role === "moderator" || user.role === "admin" || user.role === "super_admin");
  var timeAgo    = getTimeAgo(post.createdAt);

  async function handleReact(emoji: string) {
    if (reacting) return;
    setReacting(true);
    try {
      var res = await feedApi.reactToPost(post._id, emoji);
      if (onUpdate) onUpdate(res.data.data);
    } catch(err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReacting(false);
    }
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      if (isSaved) {
        await feedApi.unsavePost(post._id);
        setIsSaved(false);
        toast("Removed from saved posts");
      } else {
        await feedApi.savePost(post._id);
        setIsSaved(true);
        toast.success("Post saved!");
      }
    } catch(err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleHelpfulVote() {
    if (voting) return;
    setVoting(true);
    try {
      if (hasVotedHelpful) {
        var res = await feedApi.removeHelpfulVote(post._id);
        setHelpfulCount(res.data.data.helpfulCount);
        setHasVotedHelpful(false);
      } else {
        var res2 = await feedApi.voteHelpful(post._id);
        setHelpfulCount(res2.data.data.helpfulCount);
        setHasVotedHelpful(true);
      }
    } catch(err) {
      toast.error(getErrorMessage(err));
    } finally {
      setVoting(false);
    }
  }

  async function handlePin() {
    try {
      await feedApi.pinPost(post._id);
      toast.success(post.isPinned ? "Post unpinned" : "Post pinned");
      setMenuOpen(false);
    } catch(err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    try {
      await feedApi.deletePost(post._id);
      toast.success("Post deleted");
      if (onDelete) onDelete(post._id);
    } catch(err) {
      toast.error(getErrorMessage(err));
    }
    setMenuOpen(false);
  }

  function handleTagClick(tag: string) {
    router.push("/search?tag=" + encodeURIComponent(tag));
  }

  return React.createElement(
    "article",
    { className: "card p-5 hover:border-surface-300 transition-all duration-150" },

    /* Header */
    React.createElement(
      "div",
      { className: "flex items-start justify-between gap-3 mb-3" },
      React.createElement(
        "div",
        { className: "flex items-center gap-2.5 min-w-0" },
        React.createElement(
          Link,
          { href: "/profile/" + post.author._id },
          React.createElement(
            "div",
            { className: "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 " + getAvatarColor(post.author.name) },
            post.author.avatarUrl
              ? React.createElement("img", { src: post.author.avatarUrl, alt: post.author.name, className: "w-full h-full rounded-full object-cover" })
              : getInitials(post.author.name)
          )
        ),
        React.createElement(
          "div",
          { className: "min-w-0" },
          React.createElement(
            "div",
            { className: "flex items-center gap-1.5 flex-wrap" },
            React.createElement(Link, { href: "/profile/" + post.author._id, className: "text-sm font-semibold text-surface-900 hover:text-brand-600 transition-colors" }, post.author.name),
            post.author.role && React.createElement(ModeratorBadge, { role: post.author.role, size: "sm" }),
            post.community && React.createElement(React.Fragment, null,
              React.createElement("span", { className: "text-surface-300 text-xs" }, "in"),
              React.createElement(Link, { href: "/communities/" + post.community.slug, className: "text-xs font-semibold text-brand-600 hover:text-brand-700" }, post.community.name)
            )
          ),
          React.createElement("p", { className: "text-xs text-surface-400" }, timeAgo)
        )
      ),

      React.createElement(
        "div",
        { className: "flex items-center gap-1.5 shrink-0" },
        post.isPinned && React.createElement(Pin, { size: 13, className: "text-amber-500" }),
        post.isLocked && React.createElement(Lock, { size: 13, className: "text-surface-400" }),

        /* Save button */
        React.createElement(
          "button",
          {
            onClick: handleSave,
            disabled: saving,
            className: "w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-100 transition-colors " + (isSaved ? "text-brand-600" : "text-surface-400 hover:text-surface-700"),
            title: isSaved ? "Remove from saved" : "Save post"
          },
          isSaved ? React.createElement(BookmarkCheck, { size: 14 }) : React.createElement(Bookmark, { size: 14 })
        ),

        /* Context menu */
        (isOwner || isModerator) && React.createElement(
          "div",
          { className: "relative" },
          React.createElement(
            "button",
            { onClick: function() { setMenuOpen(function(v) { return !v; }); }, className: "w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-700 transition-colors" },
            React.createElement(MoreHorizontal, { size: 15 })
          ),
          menuOpen && React.createElement(
            "div",
            { className: "absolute right-0 top-8 w-48 bg-white border border-surface-200 rounded-xl shadow-card-lg z-20 overflow-hidden" },
            isModerator && React.createElement(
              "button",
              { onClick: handlePin, className: "w-full flex items-center gap-2 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors" },
              React.createElement(PinIcon, { size: 13 }),
              post.isPinned ? "Unpin post" : "Pin post"
            ),
            isOwner && React.createElement(
              "button",
              { onClick: handleDelete, className: "w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors" },
              React.createElement(Trash2, { size: 13 }),
              "Delete post"
            ),
            React.createElement(
              "button",
              { onClick: function() { setMenuOpen(false); toast("Report submitted"); }, className: "w-full flex items-center gap-2 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors" },
              React.createElement(Flag, { size: 13 }),
              "Report"
            )
          )
        )
      )
    ),

    /* Content */
    React.createElement(
      Link,
      { href: "/posts/" + post._id, className: "block group" },
      post.title && React.createElement("h2", { className: "text-base font-bold text-surface-900 mb-1.5 group-hover:text-brand-700 transition-colors leading-snug" }, post.title),
      React.createElement("p", { className: "text-sm text-surface-700 leading-relaxed line-clamp-3" }, post.content)
    ),

    /* Media images */
    post.mediaURLs && post.mediaURLs.length > 0 && React.createElement(
      "div",
      { className: "mt-3 flex gap-2 flex-wrap" },
      post.mediaURLs.slice(0, 4).map(function(url, idx) {
        return React.createElement("img", {
          key: idx,
          src: url,
          alt: "Post media " + (idx + 1),
          className: "w-24 h-24 object-cover rounded-xl border border-surface-200",
          loading: "lazy"
        });
      })
    ),

    /* File attachment */
    post.type === "file" && post.fileUrl && React.createElement(
      "a",
      { href: post.fileUrl, target: "_blank", rel: "noopener noreferrer", className: "mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-50 border border-surface-200 hover:border-brand-300 hover:bg-brand-50 transition-colors" },
      React.createElement(FileText, { size: 14, className: "text-brand-500 shrink-0" }),
      React.createElement("div", { className: "min-w-0" },
        React.createElement("p", { className: "text-sm font-medium text-brand-700 truncate" }, post.fileName || "Download file"),
        post.fileSize && React.createElement("p", { className: "text-xs text-surface-400" }, (post.fileSize / 1024).toFixed(1) + " KB")
      )
    ),

    /* Poll */
    post.type === "poll" && post.pollOptions && post.pollOptions.length > 0 && React.createElement(
      "div",
      { className: "mt-3 space-y-2" },
      post.pollOptions.map(function(option) {
        var total = post.pollOptions!.reduce(function(sum, o) { return sum + o.voteCount; }, 0);
        var pct = total > 0 ? Math.round((option.voteCount / total) * 100) : 0;
        return React.createElement(
          "div",
          { key: option._id, className: "relative" },
          React.createElement("div", { className: "h-8 bg-surface-100 rounded-lg overflow-hidden" },
            React.createElement("div", { className: option.hasVoted ? "h-full bg-brand-100 transition-all duration-300" : "h-full bg-surface-200 transition-all duration-300", style: { width: pct + "%" } })
          ),
          React.createElement("div", { className: "absolute inset-0 flex items-center justify-between px-3" },
            React.createElement("span", { className: "text-xs font-medium text-surface-700" }, option.text),
            React.createElement("span", { className: "text-xs font-semibold text-surface-500" }, pct + "%")
          )
        );
      })
    ),

    /* Resource link */
    post.type === "resource" && post.resourceUrl && React.createElement(
      "a",
      { href: post.resourceUrl, target: "_blank", rel: "noopener noreferrer", className: "mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-50 border border-surface-200 hover:border-brand-300 hover:bg-brand-50 transition-colors" },
      React.createElement(ExternalLink, { size: 13, className: "text-brand-500 shrink-0" }),
      React.createElement("span", { className: "text-sm font-medium text-brand-700 truncate" }, post.resourceTitle || post.resourceUrl)
    ),

    /* Tags — clickable for hashtag navigation */
    post.tags && post.tags.length > 0 && React.createElement(
      "div",
      { className: "flex flex-wrap gap-1.5 mt-3" },
      post.tags.map(function(tag) {
        return React.createElement(
          "button",
          {
            key: tag,
            onClick: function() { handleTagClick(tag); },
            className: "px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-surface-500 border border-surface-200 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors"
          },
          "#" + tag
        );
      })
    ),

    /* Footer: reactions + helpful vote + stats */
    React.createElement(
      "div",
      { className: "flex items-center justify-between mt-4 pt-3 border-t border-surface-100" },
      React.createElement(
        "div",
        { className: "flex items-center gap-1 flex-wrap" },
        REACTION_EMOJIS.map(function(emoji) {
          var reaction   = post.reactions.find(function(r) { return r.emoji === emoji; });
          var count      = reaction ? reaction.count : 0;
          var hasReacted = reaction ? reaction.hasReacted : false;
          return React.createElement(
            "button",
            {
              key: emoji,
              onClick: function() { handleReact(emoji); },
              disabled: reacting,
              className: ["flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-150",
                hasReacted ? "bg-brand-50 text-brand-700 border border-brand-200" : "hover:bg-surface-100 text-surface-500 border border-transparent hover:border-surface-200"
              ].join(" ")
            },
            emoji,
            count > 0 && React.createElement("span", null, count)
          );
        }),

        /* Helpful vote */
        React.createElement(
          "button",
          {
            onClick: handleHelpfulVote,
            disabled: voting,
            title: hasVotedHelpful ? "Remove helpful vote" : "Mark as helpful",
            className: ["flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-150 border",
              hasVotedHelpful ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "text-surface-500 border-transparent hover:bg-surface-100 hover:border-surface-200"
            ].join(" ")
          },
          React.createElement(ThumbsUp, { size: 11 }),
          helpfulCount > 0 && React.createElement("span", null, helpfulCount)
        )
      ),

      React.createElement(
        "div",
        { className: "flex items-center gap-3 text-xs text-surface-400" },
        React.createElement(
          Link,
          { href: "/posts/" + post._id, className: "flex items-center gap-1 hover:text-surface-700 transition-colors" },
          React.createElement(MessageCircle, { size: 12 }),
          formatCount(post.commentCount)
        ),
        React.createElement("span", { className: "flex items-center gap-1" },
          React.createElement(Eye, { size: 12 }),
          formatCount(post.viewCount)
        )
      )
    )
  );
}

function getTimeAgo(dateStr: string): string {
  var diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}
