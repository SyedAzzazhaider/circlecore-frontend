"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageCircle, Eye, Pin, Lock,
  ExternalLink, MoreHorizontal,
  Trash2, Flag, Bookmark, BookmarkCheck,
  ThumbsUp, FileText, PinIcon, Hash,
  BarChart2, Paperclip
} from "lucide-react";
import { type Post, feedApi } from "@/lib/api/feed.api";
import { useAuthStore }       from "@/lib/store/auth.store";
import { useSocket }          from "@/lib/context/socket.context";
import { ModeratorBadge }     from "@/components/profile/ModeratorBadge";
import { PollVoting }         from "@/components/posts/PollVoting";
import { getInitials, getAvatarColor, formatCount } from "@/lib/utils";
import { getErrorMessage }    from "@/lib/api/client";
import toast from "react-hot-toast";

var REACTION_EMOJIS = ["👍", "❤️", "🔥", "💡", "👏"];

var POST_TYPE_CONFIG = {
  poll:     { label: "Poll",     icon: BarChart2,   bg: "#fef3c7", color: "#b45309", border: "#fcd34d" },
  resource: { label: "Resource", icon: ExternalLink, bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" },
  file:     { label: "File",     icon: Paperclip,   bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  text:     { label: "",         icon: null,         bg: "",        color: "",        border: ""        }
};

type PostCardProps = {
  post:      Post;
  onDelete?: (postId: string) => void;
  onUpdate?: (post: Post)     => void;
};

export function PostCard({ post, onDelete, onUpdate }: PostCardProps) {
  var { user }   = useAuthStore();
  var router     = useRouter();
  var { onPostReactionUpdate, onPostCommentUpdate } = useSocket();

  var [menuOpen,        setMenuOpen]        = useState(false);
  var [reacting,        setReacting]        = useState(false);
  var [saving,          setSaving]          = useState(false);
  var [voting,          setVoting]          = useState(false);
  var [isSaved,         setIsSaved]         = useState(post.isSaved);
  var [helpfulCount,    setHelpfulCount]    = useState(post.helpfulCount);
  var [hasVotedHelpful, setHasVotedHelpful] = useState(post.hasVotedHelpful);
  var [reactions,       setReactions]       = useState(post.reactions || []);
  var [commentCount,    setCommentCount]    = useState(post.commentCount);

  /* ── Real-time reaction updates ─────────────────────────────── */
  useEffect(function() {
    var unsub = onPostReactionUpdate(function(payload) {
      if (payload.postId === post._id) {
        setReactions(payload.reactions);
      }
    });
    return unsub;
  }, [post._id, onPostReactionUpdate]);

  /* ── Real-time comment count updates ────────────────────────── */
  useEffect(function() {
    var unsub = onPostCommentUpdate(function(payload) {
      if (payload.postId === post._id) {
        setCommentCount(payload.commentCount);
      }
    });
    return unsub;
  }, [post._id, onPostCommentUpdate]);

  var isOwner     = user && user._id === post.author._id;
  var isModerator = user && (user.role === "moderator" || user.role === "admin" || user.role === "super_admin");
  var timeAgo     = getTimeAgo(post.createdAt);
  var typeCfg     = POST_TYPE_CONFIG[post.type] || POST_TYPE_CONFIG.text;

  async function handleReact(emoji: string) {
    if (reacting) return;
    setReacting(true);
    try {
      var res = await feedApi.reactToPost(post._id, emoji);
      var updated = (res.data as any).data as Post;
      if (updated?.reactions) setReactions(updated.reactions);
      if (onUpdate) onUpdate(updated);
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setReacting(false); }
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
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function handleHelpfulVote() {
    if (voting) return;
    setVoting(true);
    try {
      if (hasVotedHelpful) {
        var res = await feedApi.removeHelpfulVote(post._id);
        setHelpfulCount((res.data as any).data.helpfulCount);
        setHasVotedHelpful(false);
      } else {
        var res2 = await feedApi.voteHelpful(post._id);
        setHelpfulCount((res2.data as any).data.helpfulCount);
        setHasVotedHelpful(true);
      }
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setVoting(false); }
  }

  async function handlePin() {
    try {
      await feedApi.pinPost(post._id);
      toast.success(post.isPinned ? "Post unpinned" : "Post pinned");
      setMenuOpen(false);
    } catch(err) { toast.error(getErrorMessage(err)); }
  }

  async function handleDelete() {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    try {
      await feedApi.deletePost(post._id);
      toast.success("Post deleted");
      if (onDelete) onDelete(post._id);
    } catch(err) { toast.error(getErrorMessage(err)); }
    setMenuOpen(false);
  }

  function handleTagClick(tag: string) { router.push("/search?tag=" + encodeURIComponent(tag)); }

  return (
    <article className="group bg-white border border-surface-200 rounded-2xl p-5 hover:border-surface-300 hover:shadow-lg hover:shadow-surface-900/[0.04] transition-all duration-200">

      {/* Pinned / Locked banners */}
      {(post.isPinned || post.isLocked) && (
        <div className="flex gap-2 mb-3">
          {post.isPinned && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fcd34d" }}>
              <Pin size={9} />Pinned
            </div>
          )}
          {post.isLocked && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #cbd5e1" }}>
              <Lock size={9} />Locked
            </div>
          )}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={"/profile/" + post.author._id} className="shrink-0">
            <div className={"w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 " + getAvatarColor(post.author.name)}
              style={{ boxShadow: "0 0 0 2.5px white, 0 0 0 4px rgba(99,102,241,0.12)" }}>
              {post.author.avatarUrl
                ? <img src={post.author.avatarUrl} alt={post.author.name} className="w-full h-full rounded-full object-cover" />
                : getInitials(post.author.name)
              }
            </div>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={"/profile/" + post.author._id}
                className="text-sm font-bold text-surface-900 hover:text-brand-700 transition-colors truncate">
                {post.author.name}
              </Link>
              {post.author.role && (post.author.role === "moderator" || post.author.role === "admin" || post.author.role === "super_admin") && (
                <ModeratorBadge role={post.author.role} size="sm" />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[11px] text-surface-400 font-medium">{timeAgo}</span>
              {post.community && (
                <>
                  <span className="text-surface-300 text-[10px]">&middot;</span>
                  <Link href={"/communities/" + post.community.slug}
                    className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                    {post.community.name}
                  </Link>
                </>
              )}
              {typeCfg.label && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: typeCfg.bg, color: typeCfg.color, border: "1px solid " + typeCfg.border }}>
                  {typeCfg.label}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={handleSave} title={isSaved ? "Unsave" : "Save"}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-100 transition-all duration-150">
            {isSaved
              ? <BookmarkCheck size={15} className="text-brand-600" />
              : <Bookmark size={15} className="text-surface-400 hover:text-surface-700" />
            }
          </button>

          {(isOwner || isModerator) && (
            <div className="relative">
              <button onClick={function() { setMenuOpen(function(v) { return !v; }); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-100 text-surface-400 hover:text-surface-700 transition-all duration-150">
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={function() { setMenuOpen(false); }} />
                  <div className="absolute right-0 top-9 w-48 bg-white border border-surface-200 rounded-2xl shadow-xl shadow-surface-900/10 z-20 overflow-hidden py-1">
                    {isModerator && (
                      <button onClick={handlePin}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors">
                        <PinIcon size={13} className="text-surface-400" />
                        {post.isPinned ? "Unpin post" : "Pin post"}
                      </button>
                    )}
                    {isOwner && (
                      <button onClick={handleDelete}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={13} />Delete post
                      </button>
                    )}
                    <button onClick={function() { setMenuOpen(false); toast("Report submitted"); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors">
                      <Flag size={13} className="text-surface-400" />Report
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <Link href={"/posts/" + post._id} className="block group/link mb-4">
        {post.title && (
          <h2 className="text-base font-black text-surface-900 mb-2 group-hover/link:text-brand-700 transition-colors leading-snug tracking-tight">
            {post.title}
          </h2>
        )}
        <p className="text-sm text-surface-600 leading-relaxed line-clamp-3">{post.content}</p>
      </Link>

      {/* Media grid */}
      {post.mediaURLs && post.mediaURLs.length > 0 && (
        <div className={["grid gap-2 mb-4", post.mediaURLs.length === 1 ? "grid-cols-1" : "grid-cols-2"].join(" ")}>
          {post.mediaURLs.slice(0, 4).map(function(url, idx) {
            return (
              <div key={idx} className="relative overflow-hidden rounded-xl bg-surface-100"
                style={{ paddingBottom: post.mediaURLs.length === 1 ? "50%" : "70%" }}>
                <img src={url} alt={"Post media " + (idx + 1)} loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover" />
                {idx === 3 && post.mediaURLs.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">+{post.mediaURLs.length - 4}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* File attachment */}
      {post.type === "file" && post.fileUrl && (
        <a href={post.fileUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 border transition-all hover:border-brand-300 hover:bg-brand-50 group/file"
          style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
            <FileText size={15} className="text-brand-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-surface-900 truncate group-hover/file:text-brand-700 transition-colors">
              {post.fileName || "Download file"}
            </p>
            {post.fileSize && <p className="text-xs text-surface-400">{(post.fileSize / 1024).toFixed(1)} KB</p>}
          </div>
          <ExternalLink size={13} className="text-surface-400 group-hover/file:text-brand-500 transition-colors shrink-0" />
        </a>
      )}

      {/* Poll — Interactive PollVoting */}
      {post.type === "poll" && post.pollOptions && post.pollOptions.length > 0 && (
        <PollVoting
          postId={post._id}
          options={post.pollOptions}
          isLocked={post.isLocked}
          onVote={function(updatedOptions) {
            if (onUpdate) onUpdate(Object.assign({}, post, { pollOptions: updatedOptions }));
          }}
        />
      )}

      {/* Resource link */}
      {post.type === "resource" && post.resourceUrl && (
        <a href={post.resourceUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 border transition-all hover:border-blue-300 hover:bg-blue-50 group/res"
          style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
          <ExternalLink size={15} className="text-blue-500 shrink-0" />
          <span className="text-sm font-semibold text-blue-700 truncate group-hover/res:text-blue-800 transition-colors">
            {post.resourceTitle || post.resourceUrl}
          </span>
        </a>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map(function(tag) {
            return (
              <button key={tag} onClick={function() { handleTagClick(tag); }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface-100 text-surface-500 border border-surface-200 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all duration-150">
                <Hash size={9} />{tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Footer: reactions + stats */}
      <div className="flex items-center justify-between pt-3.5 border-t border-surface-100">
        <div className="flex items-center gap-1 flex-wrap">
          {REACTION_EMOJIS.map(function(emoji) {
            var reaction   = reactions.find(function(r) { return r.emoji === emoji; });
            var count      = reaction ? reaction.count : 0;
            var hasReacted = reaction ? reaction.hasReacted : false;
            return (
              <button key={emoji} onClick={function() { handleReact(emoji); }} disabled={reacting}
                className={[
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150",
                  hasReacted
                    ? "bg-brand-50 text-brand-700 border border-brand-200"
                    : "hover:bg-surface-100 text-surface-500 border border-transparent hover:border-surface-200"
                ].join(" ")}>
                <span className="text-sm leading-none">{emoji}</span>
                {count > 0 && <span className="text-[11px] font-bold">{count}</span>}
              </button>
            );
          })}

          <button onClick={handleHelpfulVote} disabled={voting}
            title={hasVotedHelpful ? "Remove helpful vote" : "Mark as helpful"}
            className={[
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 border",
              hasVotedHelpful
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "text-surface-500 border-transparent hover:bg-surface-100 hover:border-surface-200"
            ].join(" ")}>
            <ThumbsUp size={11} />
            {helpfulCount > 0 && <span>{helpfulCount}</span>}
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-surface-400">
          <Link href={"/posts/" + post._id}
            className="flex items-center gap-1.5 font-semibold hover:text-brand-600 transition-colors">
            <MessageCircle size={13} />
            <span>{formatCount(commentCount)}</span>
          </Link>
          <span className="flex items-center gap-1.5">
            <Eye size={13} />
            <span>{formatCount(post.viewCount)}</span>
          </span>
        </div>
      </div>
    </article>
  );
}

function getTimeAgo(dateStr: string): string {
  var diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)     return "just now";
  if (diff < 3600)   return Math.floor(diff / 60) + "m ago";
  if (diff < 86400)  return Math.floor(diff / 3600) + "h ago";
  if (diff < 604800) return Math.floor(diff / 86400) + "d ago";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

