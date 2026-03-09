"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { PostCard } from "@/components/posts/PostCard";
import { TypingIndicator } from "@/components/presence/TypingIndicator";
import { feedApi, type Post, type Comment, type Reaction } from "@/lib/api/feed.api";
import { useSocket } from "@/lib/context/socket.context";
import { useAuthStore } from "@/lib/store/auth.store";
import { getErrorMessage } from "@/lib/api/client";
import { getInitials, getAvatarColor, formatCount } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

var REACTION_EMOJIS  = ["👍", "❤️", "🔥", "💡", "👏"];
var TYPING_DEBOUNCE  = 2000; /* ms of inactivity before stop event fires */

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

  /* Socket: live comments + typing indicators */
  useEffect(function() {
    if (!socket || !postId) return;
    socket.emit("post:join", postId);

    function onComment(comment: Comment) {
      setComments(function(prev) { return [...prev, comment]; });
    }

    function onTypingStart(data: { userId: string; userName: string }) {
      if (user && data.userId === user._id) return;
      setTypingUsers(function(prev) {
        return prev.includes(data.userName) ? prev : [...prev, data.userName];
      });
    }

    function onTypingStop(data: { userId: string; userName: string }) {
      setTypingUsers(function(prev) {
        return prev.filter(function(n) { return n !== data.userName; });
      });
    }

    socket.on("comment:new",   onComment);
    socket.on("typing:start",  onTypingStart);
    socket.on("typing:stop",   onTypingStop);

    return function() {
      socket.emit("post:leave", postId);
      socket.off("comment:new",  onComment);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop",  onTypingStop);
    };
  }, [socket, postId, user]);

  /* Emit typing events with debounce */
  var emitTypingStop = useCallback(function() {
    if (!socket || !postId || !user) return;
    if (isTypingRef.current) {
      socket.emit("typing:stop", { postId: postId, userId: user._id, userName: user.name });
      isTypingRef.current = false;
    }
  }, [socket, postId, user]);

  function handleCommentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setCommentText(e.target.value);
    if (!socket || !postId || !user) return;

    if (!isTypingRef.current) {
      socket.emit("typing:start", { postId: postId, userId: user._id, userName: user.name });
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
        content:  commentText.trim(),
        postId:   postId,
        parentId: replyTo ? replyTo.id : undefined
      });
      setComments(function(prev) { return [...prev, res.data.data]; });
      setCommentText("");
      setReplyTo(null);
      toast.success("Comment posted");
    } catch(err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
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
          newReactions = [...c.reactions, { emoji: emoji, count: 1, hasReacted: true }];
        }
        return Object.assign({}, c, { reactions: newReactions });
      });
    });
    feedApi.reactToComment(commentId, emoji).catch(function() {});
  }

  if (loading) {
    return React.createElement("div", { className: "flex items-center justify-center min-h-[60vh]" },
      React.createElement(Loader2, { size: 28, className: "animate-spin text-brand-500" })
    );
  }

  if (error || !post) {
    return React.createElement("div", { className: "max-w-2xl mx-auto px-4 py-8 text-center" },
      React.createElement("p", { className: "font-semibold text-surface-900 mb-1" }, "Post not found"),
      React.createElement("p", { className: "text-sm text-surface-400 mb-4" }, error),
      React.createElement(Button, { variant: "secondary", onClick: function() { router.back(); } }, "Go back")
    );
  }

  return React.createElement(
    "div",
    { className: "max-w-2xl mx-auto px-4 py-6" },

    React.createElement("button", {
      onClick: function() { router.back(); },
      className: "flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-900 transition-colors mb-4 font-medium"
    }, React.createElement(ArrowLeft, { size: 15 }), "Back"),

    React.createElement(PostCard, { post: post }),

    post.isLocked && React.createElement("div", { className: "mt-4 p-3 rounded-xl bg-surface-100 border border-surface-200 flex items-center gap-2 text-sm text-surface-500" },
      React.createElement(Lock, { size: 14 }),
      "This post is locked. New comments are disabled."
    ),

    !post.isLocked && React.createElement("div", { className: "mt-5 card p-4" },
      replyTo && React.createElement("div", { className: "flex items-center justify-between mb-2 px-2 py-1 bg-brand-50 rounded-lg" },
        React.createElement("span", { className: "text-xs font-medium text-brand-700" }, "Replying to " + replyTo.name),
        React.createElement("button", { onClick: function() { setReplyTo(null); }, className: "text-xs text-brand-500 hover:text-brand-700 font-semibold" }, "Cancel")
      ),
      React.createElement("div", { className: "flex gap-3" },
        user && React.createElement("div", { className: "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 " + getAvatarColor(user.name) }, getInitials(user.name)),
        React.createElement("div", { className: "flex-1" },
          React.createElement("textarea", {
            value: commentText,
            onChange: handleCommentChange,
            placeholder: "Write a comment...",
            rows: 3,
            maxLength: 2000,
            className: "input resize-none w-full",
            style: { height: "auto" },
            onKeyDown: function(e: React.KeyboardEvent) {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSubmitComment();
              }
            }
          }),
          /* Typing indicator */
          React.createElement(TypingIndicator, { names: typingUsers }),
          React.createElement("div", { className: "flex items-center justify-between mt-2" },
            React.createElement("span", { className: "text-xs text-surface-400" }, commentText.length + "/2000 \xB7 Ctrl+Enter to submit"),
            React.createElement(Button, { size: "sm", loading: submitting, disabled: commentText.trim().length === 0, onClick: handleSubmitComment }, "Comment")
          )
        )
      )
    ),

    React.createElement("div", { className: "mt-5" },
      React.createElement("h2", { className: "text-sm font-bold text-surface-900 mb-3" },
        formatCount(comments.length) + " comment" + (comments.length !== 1 ? "s" : "")
      ),
      comments.length === 0 ? (
        React.createElement("div", { className: "card p-8 text-center" },
          React.createElement("p", { className: "text-sm text-surface-400" }, "No comments yet. Be the first!")
        )
      ) : (
        React.createElement("div", { className: "space-y-3" },
          comments
            .filter(function(c) { return !c.parentId; })
            .map(function(comment) {
              var replies = comments.filter(function(c) { return c.parentId === comment._id; });
              return React.createElement(CommentItem, {
                key: comment._id,
                comment: comment,
                replies: replies,
                onReply: function(id, name) { setReplyTo({ id: id, name: name }); },
                onReact: handleCommentReaction
              });
            })
        )
      )
    )
  );
}

function CommentItem({ comment, replies, onReply, onReact }: {
  comment: Comment;
  replies: Comment[];
  onReply: (id: string, name: string) => void;
  onReact: (commentId: string, emoji: string) => void;
}) {
  var avatarBg = getAvatarColor(comment.author.name);
  var initials = getInitials(comment.author.name);
  var timeAgo  = getTimeAgo(comment.createdAt);

  return React.createElement("div", { className: "card p-4" },
    React.createElement("div", { className: "flex items-start gap-2.5" },
      React.createElement("div", { className: "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 " + avatarBg },
        comment.author.avatarUrl
          ? React.createElement("img", { src: comment.author.avatarUrl, alt: comment.author.name, className: "w-full h-full rounded-full object-cover" })
          : initials
      ),
      React.createElement("div", { className: "flex-1 min-w-0" },
        React.createElement("div", { className: "flex items-center gap-2 mb-1" },
          React.createElement("span", { className: "text-sm font-semibold text-surface-900" }, comment.author.name),
          React.createElement("span", { className: "text-xs text-surface-400" }, timeAgo),
          comment.isEdited && React.createElement("span", { className: "text-xs text-surface-400 italic" }, "(edited)")
        ),
        React.createElement("p", { className: "text-sm text-surface-700 leading-relaxed" }, comment.content),
        React.createElement("div", { className: "flex items-center gap-1 mt-2 flex-wrap" },
          REACTION_EMOJIS.map(function(emoji) {
            var reaction   = comment.reactions.find(function(r) { return r.emoji === emoji; });
            var count      = reaction ? reaction.count : 0;
            var hasReacted = reaction ? reaction.hasReacted : false;
            return React.createElement("button", {
              key: emoji,
              onClick: function() { onReact(comment._id, emoji); },
              className: ["flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-xs transition-all duration-150",
                hasReacted ? "bg-brand-50 text-brand-700 border border-brand-200" : "text-surface-400 hover:bg-surface-100 border border-transparent"
              ].join(" ")
            }, emoji, count > 0 && React.createElement("span", { className: "ml-0.5 font-medium" }, count));
          }),
          React.createElement("button", {
            onClick: function() { onReply(comment._id, comment.author.name); },
            className: "ml-1 text-xs font-semibold text-surface-400 hover:text-brand-600 transition-colors px-1.5 py-0.5 rounded-lg hover:bg-surface-100"
          }, "Reply")
        )
      )
    ),
    replies.length > 0 && React.createElement("div", { className: "mt-3 ml-9 pl-3 border-l-2 border-surface-100 space-y-3" },
      replies.map(function(reply) {
        return React.createElement("div", { key: reply._id, className: "flex items-start gap-2" },
          React.createElement("div", { className: "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 " + getAvatarColor(reply.author.name) }, getInitials(reply.author.name)),
          React.createElement("div", null,
            React.createElement("div", { className: "flex items-center gap-2 mb-0.5" },
              React.createElement("span", { className: "text-xs font-semibold text-surface-900" }, reply.author.name),
              React.createElement("span", { className: "text-xs text-surface-400" }, getTimeAgo(reply.createdAt))
            ),
            React.createElement("p", { className: "text-xs text-surface-700 leading-relaxed" }, reply.content),
            React.createElement("div", { className: "flex items-center gap-1 mt-1.5" },
              REACTION_EMOJIS.map(function(emoji) {
                var reaction = reply.reactions.find(function(r) { return r.emoji === emoji; });
                var count    = reaction ? reaction.count : 0;
                var reacted  = reaction ? reaction.hasReacted : false;
                return React.createElement("button", {
                  key: emoji,
                  onClick: function() { onReact(reply._id, emoji); },
                  className: ["flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-xs transition-all duration-150",
                    reacted ? "bg-brand-50 text-brand-700 border border-brand-200" : "text-surface-400 hover:bg-surface-100 border border-transparent"
                  ].join(" ")
                }, emoji, count > 0 && React.createElement("span", { className: "ml-0.5 font-medium" }, count));
              })
            )
          )
        );
      })
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
