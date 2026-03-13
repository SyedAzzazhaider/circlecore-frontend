"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Lock, MessageCircle, CornerDownRight } from "lucide-react";
import { PostCard }        from "@/components/posts/PostCard";
import { TypingIndicator } from "@/components/presence/TypingIndicator";
import { feedApi, type Post, type Comment } from "@/lib/api/feed.api";
import { useSocket }       from "@/lib/context/socket.context";
import { useAuthStore }    from "@/lib/store/auth.store";
import { getErrorMessage } from "@/lib/api/client";
import { getInitials, getAvatarColor, formatCount } from "@/lib/utils";
import { Button }          from "@/components/ui/Button";
import toast from "react-hot-toast";

var REACTION_EMOJIS = ["👍", "❤️", "🔥", "💡", "👏"];
var TYPING_DEBOUNCE = 2000;

function CommentItem({ comment, depth, onReply, onDelete, onReact }: {
  comment: Comment; depth: number;
  onReply:  (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onReact:  (id: string, emoji: string) => void;
}) {
  var { user } = useAuthStore();
  var [showReactions, setShowReactions] = useState(false);
  var isOwner = user && user._id === comment.author._id;
  var diff    = Math.floor((Date.now() - new Date(comment.createdAt).getTime()) / 1000);
  var timeAgo = diff < 60 ? "just now" : diff < 3600 ? Math.floor(diff / 60) + "m ago" : Math.floor(diff / 3600) + "h ago";

  return (
    <div className={["flex gap-3", depth > 0 ? "ml-9 mt-3" : ""].join(" ")}>
      {depth > 0 && <CornerDownRight size={13} className="text-surface-300 mt-3.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex gap-3">
          <div className={"w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 " + getAvatarColor(comment.author.name)}>
            {comment.author.avatarUrl
              ? <img src={comment.author.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              : getInitials(comment.author.name)
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-surface-50 border border-surface-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-surface-900">{comment.author.name}</span>
                <span className="text-[10px] text-surface-400">{timeAgo}</span>
                {comment.isEdited && <span className="text-[10px] text-surface-300 italic">edited</span>}
              </div>
              <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
            </div>
            <div className="flex items-center gap-3 mt-2 px-1">
              <div className="relative">
                <button onClick={function() { setShowReactions(function(v) { return !v; }); }}
                  className="text-[11px] text-surface-400 hover:text-brand-600 font-semibold transition-colors">
                  React
                </button>
                {showReactions && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={function() { setShowReactions(false); }} />
                    <div className="absolute bottom-7 left-0 z-20 flex gap-1 bg-white border border-surface-200 rounded-2xl shadow-lg px-2 py-1.5">
                      {REACTION_EMOJIS.map(function(emoji) {
                        return (
                          <button key={emoji} onClick={function() { onReact(comment._id, emoji); setShowReactions(false); }}
                            className="text-lg hover:scale-125 transition-transform p-0.5">
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              {depth === 0 && (
                <button onClick={function() { onReply(comment._id, comment.author.name); }}
                  className="text-[11px] text-surface-400 hover:text-brand-600 font-semibold transition-colors flex items-center gap-1">
                  <CornerDownRight size={10} />Reply
                </button>
              )}
              {isOwner && (
                <button onClick={function() { if (confirm("Delete comment?")) onDelete(comment._id); }}
                  className="text-[11px] text-red-400 hover:text-red-600 font-semibold transition-colors">
                  Delete
                </button>
              )}
              {comment.reactions && comment.reactions.some(function(r) { return r.count > 0; }) && (
                <div className="flex items-center gap-1 ml-1">
                  {comment.reactions.filter(function(r) { return r.count > 0; }).map(function(r) {
                    return (
                      <button key={r.emoji} onClick={function() { onReact(comment._id, r.emoji); }}
                        className={["flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] border transition-all",
                          r.hasReacted ? "bg-brand-50 border-brand-200 text-brand-700" : "bg-surface-50 border-surface-200 text-surface-600 hover:border-brand-200 hover:bg-brand-50"
                        ].join(" ")}>
                        <span>{r.emoji}</span>
                        <span className="font-bold">{r.count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map(function(reply) {
              return <CommentItem key={reply._id} comment={reply} depth={depth + 1} onReply={onReply} onDelete={onDelete} onReact={onReact} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostDetailPage() {
  var params  = useParams();
  var router  = useRouter();
  var postId  = params.postId as string;
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
        setPost((results[0].data as any).data as Post);
        setComments((results[1].data as any).data as Comment[]);
      })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); });
  }, [postId]);

  useEffect(function() {
    if (!socket || !postId) return;
    socket.emit("post:join", postId);
    function onComment(comment: Comment) {
      setComments(function(prev) {
        if (comment.parentId) {
          return prev.map(function(c) {
            return c._id === comment.parentId ? Object.assign({}, c, { replies: [...(c.replies || []), comment] }) : c;
          });
        }
        return [...prev, comment];
      });
    }
    function onCommentDeleted(data: { commentId: string }) {
      setComments(function(prev) {
        return prev.filter(function(c) { return c._id !== data.commentId; })
          .map(function(c) { return Object.assign({}, c, { replies: (c.replies || []).filter(function(r) { return r._id !== data.commentId; }) }); });
      });
    }
    function onTypingStart(data: { userId: string; userName: string }) {
      if (user && data.userId === user._id) return;
      setTypingUsers(function(prev) { return prev.includes(data.userName) ? prev : [...prev, data.userName]; });
    }
    function onTypingStop(data: { userId: string; userName: string }) {
      setTypingUsers(function(prev) { return prev.filter(function(n) { return n !== data.userName; }); });
    }
    socket.on("comment:new",     onComment);
    socket.on("comment:deleted", onCommentDeleted);
    socket.on("typing:start",    onTypingStart);
    socket.on("typing:stop",     onTypingStop);
    return function() {
      socket.emit("post:leave", postId);
      socket.off("comment:new",     onComment);
      socket.off("comment:deleted", onCommentDeleted);
      socket.off("typing:start",    onTypingStart);
      socket.off("typing:stop",     onTypingStop);
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
      var res = await feedApi.createComment({ content: commentText.trim(), postId, parentId: replyTo?.id });
      var newComment = (res.data as any).data as Comment;
      if (replyTo) {
        setComments(function(prev) {
          return prev.map(function(c) {
            return c._id === replyTo.id ? Object.assign({}, c, { replies: [...(c.replies || []), newComment] }) : c;
          });
        });
      } else {
        setComments(function(prev) { return [...prev, newComment]; });
      }
      setCommentText("");
      setReplyTo(null);
      if (commentBoxRef.current) commentBoxRef.current.style.height = "auto";
      if (post) setPost(function(p) { return p ? Object.assign({}, p, { commentCount: p.commentCount + 1 }) : p; });
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setSubmitting(false); }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      await feedApi.deleteComment(commentId);
      setComments(function(prev) {
        return prev.filter(function(c) { return c._id !== commentId; })
          .map(function(c) { return Object.assign({}, c, { replies: (c.replies || []).filter(function(r) { return r._id !== commentId; }) }); });
      });
      toast.success("Comment deleted");
    } catch(err) { toast.error(getErrorMessage(err)); }
  }

  async function handleReactToComment(commentId: string, emoji: string) {
    try {
      var res = await feedApi.reactToComment(commentId, emoji);
      var updated = (res.data as any).data as Comment;
      setComments(function(prev) {
        return prev.map(function(c) {
          if (c._id === commentId) return Object.assign({}, c, { reactions: updated.reactions });
          return Object.assign({}, c, {
            replies: (c.replies || []).map(function(r) {
              return r._id === commentId ? Object.assign({}, r, { reactions: updated.reactions }) : r;
            })
          });
        });
      });
    } catch(err) { toast.error(getErrorMessage(err)); }
  }

  function handleReply(id: string, name: string) {
    setReplyTo({ id, name });
    if (commentBoxRef.current) {
      commentBoxRef.current.focus();
      commentBoxRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  var topLevelComments = comments.filter(function(c) { return !c.parentId; });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-brand-500" />
        </div>
        <p className="text-sm text-surface-400 font-medium">Loading post...</p>
      </div>
    </div>
  );

  if (error || !post) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="card p-12">
        <p className="text-base font-black text-surface-900 mb-2">Post not found</p>
        <p className="text-sm text-surface-400 mb-6">{error}</p>
        <Button variant="secondary" onClick={function() { router.back(); }}>Go back</Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={function() { router.back(); }}
        className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-900 font-semibold mb-5 transition-colors">
        <ArrowLeft size={15} />Back
      </button>

      <PostCard post={post} onUpdate={setPost} />

      <div className="mt-4 bg-white border border-surface-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black text-surface-900 flex items-center gap-2">
            <MessageCircle size={15} className="text-brand-500" />
            {formatCount(topLevelComments.length)} {topLevelComments.length === 1 ? "comment" : "comments"}
          </h3>
          {post.isLocked && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-surface-500 bg-surface-100 px-2.5 py-1 rounded-full border border-surface-200">
              <Lock size={10} />Locked
            </span>
          )}
        </div>

        {!post.isLocked && user && (
          <div className="mb-6">
            {replyTo && (
              <div className="flex items-center justify-between mb-2 px-3 py-2 rounded-xl bg-brand-50 border border-brand-200">
                <span className="text-xs text-brand-700 font-semibold flex items-center gap-1.5">
                  <CornerDownRight size={11} />Replying to {replyTo.name}
                </span>
                <button onClick={function() { setReplyTo(null); }}
                  className="text-xs text-surface-400 hover:text-surface-700 font-bold transition-colors">
                  Cancel
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <div className={"w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1 " + getAvatarColor(user.name)}>
                {getInitials(user.name)}
              </div>
              <div className="flex-1">
                <textarea ref={commentBoxRef} value={commentText} onChange={handleCommentChange}
                  placeholder={replyTo ? "Write a reply..." : "Write a comment..."} rows={1}
                  className="w-full px-4 py-3 rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 resize-none outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all" />
                {commentText.trim() && (
                  <div className="flex justify-end mt-2">
                    <Button size="sm" loading={submitting} onClick={handleSubmitComment}>
                      Post {replyTo ? "reply" : "comment"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {typingUsers.length > 0 && <TypingIndicator names={typingUsers} />}

        {topLevelComments.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-10 h-10 rounded-2xl bg-surface-100 border border-surface-200 flex items-center justify-center mx-auto mb-3">
              <MessageCircle size={16} className="text-surface-400" />
            </div>
            <p className="text-sm font-bold text-surface-700 mb-1">No comments yet</p>
            <p className="text-xs text-surface-400">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topLevelComments.map(function(comment) {
              return <CommentItem key={comment._id} comment={comment} depth={0} onReply={handleReply} onDelete={handleDeleteComment} onReact={handleReactToComment} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
