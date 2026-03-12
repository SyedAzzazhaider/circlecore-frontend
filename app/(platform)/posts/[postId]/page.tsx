"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Lock, ChevronDown, ChevronRight, MessageCircle } from "lucide-react";
import { PostCard }          from "@/components/posts/PostCard";
import { TypingIndicator }   from "@/components/presence/TypingIndicator";
import { feedApi, type Post, type Comment, type Reaction } from "@/lib/api/feed.api";
import { useSocket }         from "@/lib/context/socket.context";
import { useAuthStore }      from "@/lib/store/auth.store";
import { getErrorMessage }   from "@/lib/api/client";
import { getInitials, getAvatarColor, formatCount } from "@/lib/utils";
import { Button }            from "@/components/ui/Button";
import toast from "react-hot-toast";

var REACTION_EMOJIS = ["👍", "❤️", "🔥", "💡", "👏"];
var TYPING_DEBOUNCE = 2000;

export default function PostDetailPage() {
  var params = useParams();
  var router = useRouter();
  var postId = params.postId as string;
  var { socket } = useSocket();
  var { user }   = useAuthStore();

  var [post,        setPost]        = useState<Post | null>(null);
  var [comments,    setComments]    = useState<Comment[]>([]);
  var [loading,     setLoading]     = useState(true);
  var [error,       setError]       = useState("");
  var [commentText, setCommentText] = useState("");
  var [submitting,  setSubmitting]  = useState(false);
  var [replyTo,     setReplyTo]     = useState<{ id: string; name: string } | null>(null);
  var [typingUsers, setTypingUsers] = useState<string[]>([]);

  var typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  var isTypingRef    = useRef(false);
  var commentBoxRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(function() {
    if (!postId) return;
    setLoading(true);
    Promise.all([feedApi.getPost(postId), feedApi.getComments(postId)])
      .then(function(results) {
        setPost(results[0].data.data);
        setComments(results[1].data.data);
      })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); });
  }, [postId]);

  useEffect(function() {
    if (!socket || !postId) return;
    socket.emit("post:join", postId);
    function onComment(comment: Comment) { setComments(function(prev) { return [...prev, comment]; }); }
    function onTypingStart(data: { userId: string; userName: string }) {
      if (user && data.userId === user._id) return;
      setTypingUsers(function(prev) { return prev.includes(data.userName) ? prev : [...prev, data.userName]; });
    }
    function onTypingStop(data: { userId: string; userName: string }) {
      setTypingUsers(function(prev) { return prev.filter(function(n) { return n !== data.userName; }); });
    }
    socket.on("comment:new",  onComment);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop",  onTypingStop);
    return function() {
      socket.emit("post:leave", postId);
      socket.off("comment:new",  onComment);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop",  onTypingStop);
    };
  }, [socket, postId, user]);

  var emitTypingStop = useCallback(function() {
    if (!socket || !postId || !user) return;
    if (isTypingRef.current) {
      socket.emit("typing:stop", { postId, userId: user._id, userName: user.name });
      isTypingRef.current = false;
    }
  }, [socket, postId, user]);

  function handleCommentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setCommentText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
    if (!socket || !postId || !user) return;
    if (!isTypingRef.current) {
      socket.emit("typing:start", { postId, userId: user._id, userName: user.name });
      isTypingRef.current = true;
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(emitTypingStop, TYPING_DEBOUNCE);
  }

  async function handleSubmitComment() {
    if (!commentText.trim()) return;
    if (!user) { toast.error("Sign in to comment"); return; }
    emitTypingStop();
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setSubmitting(true);
    try {
      var res = await feedApi.createComment({
        content: commentText.trim(), postId,
        parentId: replyTo ? replyTo.id : undefined
      });
      setComments(function(prev) { return [...prev, res.data.data]; });
      setCommentText("");
      setReplyTo(null);
      if (commentBoxRef.current) { commentBoxRef.current.style.height = "auto"; }
      toast.success("Comment posted");
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setSubmitting(false); }
  }

  function handleCommentReaction(commentId: string, emoji: string) {
    setComments(function(prev) {
      return prev.map(function(c) {
        if (c._id !== commentId) return c;
        var existing = c.reactions.find(function(r) { return r.emoji === emoji; });
        var newReactions: Reaction[];
        if (existing) {
          newReactions = c.reactions.map(function(r) {
            return r.emoji === emoji
              ? { emoji: r.emoji, count: r.hasReacted ? r.count - 1 : r.count + 1, hasReacted: !r.hasReacted }
              : r;
          });
        } else {
          newReactions = [...c.reactions, { emoji, count: 1, hasReacted: true }];
        }
        return Object.assign({}, c, { reactions: newReactions });
      });
    });
    feedApi.reactToComment(commentId, emoji).catch(function() {});
  }

  function handleSetReply(id: string, name: string) {
    setReplyTo({ id, name });
    setTimeout(function() { if (commentBoxRef.current) commentBoxRef.current.focus(); }, 100);
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={function() { router.back(); }}
        className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-900 mb-6 font-semibold transition-colors">
        <ArrowLeft size={15} />Back
      </button>
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-brand-500" />
        </div>
        <p className="text-sm text-surface-400 font-medium">Loading post...</p>
      </div>
    </div>
  );

  if (error || !post) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={function() { router.back(); }}
        className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-900 mb-6 font-semibold transition-colors">
        <ArrowLeft size={15} />Back
      </button>
      <div className="card p-10 text-center">
        <p className="text-sm font-bold text-surface-900 mb-1">Post not found</p>
        <p className="text-xs text-surface-400">{error}</p>
      </div>
    </div>
  );

  var topComments = comments.filter(function(c) { return !c.parentId; });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      <button onClick={function() { router.back(); }}
        className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-900 mb-5 font-semibold transition-colors group">
        <div className="w-7 h-7 rounded-lg bg-surface-100 group-hover:bg-surface-200 flex items-center justify-center transition-colors">
          <ArrowLeft size={14} />
        </div>
        Back to feed
      </button>

      <PostCard post={post} onUpdate={function(updated) { setPost(updated); }} />

      {post.isLocked && (
        <div className="mt-4 flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="w-8 h-8 rounded-xl bg-surface-200 flex items-center justify-center shrink-0">
            <Lock size={14} className="text-surface-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-surface-700">Conversation locked</p>
            <p className="text-xs text-surface-500">New comments are disabled for this post.</p>
          </div>
        </div>
      )}

      {!post.isLocked && user && (
        <div className="mt-5 bg-white border border-surface-200 rounded-2xl p-4 hover:border-surface-300 transition-colors">
          {replyTo && (
            <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl"
              style={{ background: "linear-gradient(135deg,#eef2ff,#f0f9ff)", border: "1px solid #c7d2fe" }}>
              <span className="text-xs font-bold text-brand-700">Replying to {replyTo.name}</span>
              <button onClick={function() { setReplyTo(null); }}
                className="text-xs text-brand-400 hover:text-brand-700 font-bold transition-colors">Cancel</button>
            </div>
          )}
          <div className="flex gap-3">
            <div className={"w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 mt-0.5 " + getAvatarColor(user.name)}>
              {getInitials(user.name)}
            </div>
            <div className="flex-1">
              <textarea
                ref={commentBoxRef}
                value={commentText}
                onChange={handleCommentChange}
                placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
                rows={2}
                maxLength={2000}
                className="input resize-none w-full"
                onKeyDown={function(e: React.KeyboardEvent) {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSubmitComment(); }
                }}
              />
              <TypingIndicator names={typingUsers} />
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-[10px] text-surface-400 font-medium">{commentText.length}/2000 · Ctrl+Enter to post</span>
                <Button size="sm" loading={submitting} disabled={commentText.trim().length === 0}
                  onClick={handleSubmitComment} leftIcon={<MessageCircle size={12} />}>
                  {replyTo ? "Reply" : "Comment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle size={14} className="text-surface-400" />
          <h2 className="text-sm font-black text-surface-900 tracking-tight">
            {formatCount(topComments.length)} {topComments.length === 1 ? "comment" : "comments"}
          </h2>
        </div>

        {topComments.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
              <MessageCircle size={18} className="text-surface-400" />
            </div>
            <p className="text-sm font-semibold text-surface-600 mb-1">No comments yet</p>
            <p className="text-xs text-surface-400">Be the first to start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topComments.map(function(comment) {
              var replies = comments.filter(function(c) { return c.parentId === comment._id; });
              return <CommentItem key={comment._id} comment={comment} replies={replies} onReply={handleSetReply} onReact={handleCommentReaction} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentItem({ comment, replies, onReply, onReact }: {
  comment: Comment;
  replies: Comment[];
  onReply: (id: string, name: string) => void;
  onReact: (commentId: string, emoji: string) => void;
}) {
  var [showReplies, setShowReplies] = useState(true);
  var avatarBg = getAvatarColor(comment.author.name);
  var initials = getInitials(comment.author.name);
  var timeAgo  = getTimeAgo(comment.createdAt);

  return (
    <div className="bg-white border border-surface-200 rounded-2xl p-4 hover:border-surface-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className={"w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 " + avatarBg}>
          {comment.author.avatarUrl
            ? <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-full h-full rounded-full object-cover" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-sm font-bold text-surface-900">{comment.author.name}</span>
            <span className="text-xs text-surface-400">{timeAgo}</span>
            {comment.isEdited && (
              <span className="text-[10px] text-surface-400 italic px-1.5 py-0.5 bg-surface-100 rounded-full">edited</span>
            )}
          </div>
          <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-1 mt-3 flex-wrap">
            {REACTION_EMOJIS.map(function(emoji) {
              var reaction   = comment.reactions.find(function(r) { return r.emoji === emoji; });
              var count      = reaction ? reaction.count : 0;
              var hasReacted = reaction ? reaction.hasReacted : false;
              return (
                <button key={emoji} onClick={function() { onReact(comment._id, emoji); }}
                  className={["flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-150",
                    hasReacted ? "bg-brand-50 text-brand-700 border border-brand-200" : "text-surface-400 hover:bg-surface-100 border border-transparent hover:border-surface-200"
                  ].join(" ")}>
                  <span className="text-sm leading-none">{emoji}</span>
                  {count > 0 && <span className="text-[11px] font-bold">{count}</span>}
                </button>
              );
            })}
            <button onClick={function() { onReply(comment._id, comment.author.name); }}
              className="ml-1 text-xs font-bold text-surface-400 hover:text-brand-600 transition-colors px-2 py-1 rounded-lg hover:bg-brand-50">
              Reply
            </button>
          </div>

          {replies.length > 0 && (
            <div className="mt-3">
              <button onClick={function() { setShowReplies(function(v) { return !v; }); }}
                className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors mb-3">
                {showReplies ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </button>
              {showReplies && (
                <div className="space-y-3 pl-4 border-l-2 border-surface-100">
                  {replies.map(function(reply) {
                    return (
                      <div key={reply._id} className="flex items-start gap-2.5">
                        <div className={"w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0 " + getAvatarColor(reply.author.name)}>
                          {reply.author.avatarUrl
                            ? <img src={reply.author.avatarUrl} alt={reply.author.name} className="w-full h-full rounded-full object-cover" />
                            : getInitials(reply.author.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-bold text-surface-900">{reply.author.name}</span>
                            <span className="text-[10px] text-surface-400">{getTimeAgo(reply.createdAt)}</span>
                            {reply.isEdited && <span className="text-[9px] text-surface-400 italic px-1 py-0.5 bg-surface-100 rounded">edited</span>}
                          </div>
                          <p className="text-xs text-surface-700 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            {REACTION_EMOJIS.map(function(emoji) {
                              var reaction = reply.reactions.find(function(r) { return r.emoji === emoji; });
                              var count    = reaction ? reaction.count : 0;
                              var reacted  = reaction ? reaction.hasReacted : false;
                              return (
                                <button key={emoji} onClick={function() { onReact(reply._id, emoji); }}
                                  className={["flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-xs transition-all duration-150",
                                    reacted ? "bg-brand-50 text-brand-700 border border-brand-200" : "text-surface-400 hover:bg-surface-100 border border-transparent"
                                  ].join(" ")}>
                                  <span className="leading-none">{emoji}</span>
                                  {count > 0 && <span className="ml-0.5 font-bold text-[10px]">{count}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
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