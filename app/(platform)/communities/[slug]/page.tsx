"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, Hash, Lock, Loader2, ArrowLeft } from "lucide-react";
import { communityApi, type Community, type Channel } from "@/lib/api/community.api";
import { feedApi, type Post } from "@/lib/api/feed.api";
import { PostComposer } from "@/components/posts/PostComposer";
import { PostCard } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/Button";
import { formatCount } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/client";
import toast from "react-hot-toast";

export default function CommunityPage() {
  var params   = useParams();
  var router   = useRouter();
  var slug     = params.slug as string;

  var [community, setCommunity]     = useState<Community | null>(null);
  var [posts, setPosts]             = useState<Post[]>([]);
  var [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  var [loading, setLoading]         = useState(true);
  var [postsLoading, setPostsLoading] = useState(false);
  var [joining, setJoining]         = useState(false);
  var [error, setError]             = useState("");

  useEffect(function() {
    if (!slug) return;
    setLoading(true);
    communityApi
      .getCommunity(slug)
      .then(function(res) {
        var c = res.data.data;
        setCommunity(c);
        if (c.channels && c.channels.length > 0 && c.channels[0]) {
          setActiveChannel(c.channels[0]);
        }
      })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); });
  }, [slug]);

  useEffect(function() {
    if (!slug) return;
    setPostsLoading(true);
    var channelId = activeChannel ? activeChannel._id : null;
    communityApi
      .getCommunityFeed(slug, channelId, 1)
      .then(function(res) { setPosts(res.data.data.posts); })
      .catch(function(err) { toast.error(getErrorMessage(err)); })
      .finally(function() { setPostsLoading(false); });
  }, [slug, activeChannel]);

  async function handleJoin() {
    if (!community) return;
    setJoining(true);
    try {
      await communityApi.joinCommunity(community._id);
      setCommunity(function(prev) {
        if (!prev) return prev;
        return Object.assign({}, prev, {
          isMember: true,
          memberCount: prev.memberCount + 1
        });
      });
      toast.success("Joined " + community.name + "!");
    } catch(err) {
      toast.error(getErrorMessage(err));
    } finally {
      setJoining(false);
    }
  }

  async function handleLeave() {
    if (!community) return;
    if (!confirm("Leave " + community.name + "?")) return;
    try {
      await communityApi.leaveCommunity(community._id);
      setCommunity(function(prev) {
        if (!prev) return prev;
        return Object.assign({}, prev, {
          isMember: false,
          memberCount: Math.max(0, prev.memberCount - 1)
        });
      });
      toast.success("Left " + community.name);
    } catch(err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (loading) {
    return React.createElement(
      "div",
      { className: "flex items-center justify-center min-h-[60vh]" },
      React.createElement(Loader2, { size: 28, className: "animate-spin text-brand-500" })
    );
  }

  if (error || !community) {
    return React.createElement(
      "div",
      { className: "max-w-4xl mx-auto px-4 py-8 text-center" },
      React.createElement("p", { className: "font-semibold text-surface-900 mb-1" }, "Community not found"),
      React.createElement("p", { className: "text-sm text-surface-400 mb-4" }, error),
      React.createElement(
        Button,
        { variant: "secondary", onClick: function() { router.push("/communities"); } },
        "Back to communities"
      )
    );
  }

  return React.createElement(
    "div",
    { className: "flex h-[calc(100vh-0px)] lg:h-screen overflow-hidden" },

    /* ── Channel sidebar ── */
    React.createElement(
      "div",
      { className: "w-56 shrink-0 bg-white border-r border-surface-200 flex flex-col hidden md:flex" },
      React.createElement(
        "div",
        { className: "p-4 border-b border-surface-100" },
        React.createElement(
          "button",
          {
            onClick: function() { router.push("/communities"); },
            className: "flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-700 font-medium mb-3 transition-colors"
          },
          React.createElement(ArrowLeft, { size: 12 }),
          "All communities"
        ),
        React.createElement("h2", { className: "text-sm font-bold text-surface-900 truncate" }, community.name),
        React.createElement(
          "div",
          { className: "flex items-center gap-2 mt-1" },
          React.createElement(
            "span",
            { className: "flex items-center gap-1 text-xs text-surface-400" },
            React.createElement(Users, { size: 11 }),
            formatCount(community.memberCount)
          ),
          community.isPrivate && React.createElement(Lock, { size: 11, className: "text-surface-400" })
        )
      ),

      /* Join/Leave */
      React.createElement(
        "div",
        { className: "px-3 py-2 border-b border-surface-100" },
        community.isMember ? (
          React.createElement(
            Button,
            { variant: "ghost", size: "sm", fullWidth: true, onClick: handleLeave },
            "Leave"
          )
        ) : (
          React.createElement(
            Button,
            { size: "sm", fullWidth: true, loading: joining, onClick: handleJoin },
            "Join community"
          )
        )
      ),

      /* Channels list */
      React.createElement(
        "nav",
        { className: "flex-1 overflow-y-auto px-2 py-3" },
        community.channels.map(function(channel) {
          var isActive = activeChannel && activeChannel._id === channel._id;
          return React.createElement(
            "button",
            {
              key: channel._id,
              onClick: function() { setActiveChannel(channel); },
              className: [
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left",
                isActive
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-surface-600 hover:bg-surface-100"
              ].join(" ")
            },
            React.createElement(Hash, {
              size: 13,
              className: isActive ? "text-brand-500 shrink-0" : "text-surface-400 shrink-0"
            }),
            React.createElement("span", { className: "truncate text-xs" }, channel.name),
            channel.isPrivate && React.createElement(Lock, { size: 10, className: "text-surface-400 ml-auto shrink-0" })
          );
        })
      )
    ),

    /* ── Main content ── */
    React.createElement(
      "div",
      { className: "flex-1 overflow-y-auto" },
      React.createElement(
        "div",
        { className: "max-w-2xl mx-auto px-4 py-6" },

        /* Channel header */
        activeChannel && React.createElement(
          "div",
          { className: "flex items-center gap-2 mb-5 pb-4 border-b border-surface-200" },
          React.createElement(Hash, { size: 16, className: "text-surface-400" }),
          React.createElement("h1", { className: "text-base font-bold text-surface-900" }, activeChannel.name),
          activeChannel.description && React.createElement(
            "span",
            { className: "text-xs text-surface-400 ml-1" },
            "— " + activeChannel.description
          )
        ),

        /* Composer — only for members */
        community.isMember && React.createElement(
          "div",
          { className: "mb-5" },
          React.createElement(PostComposer, {
            communityId: community._id,
            channelId: activeChannel ? activeChannel._id : undefined,
            onPostCreated: function(post) {
              setPosts(function(prev) { return [post, ...prev]; });
            }
          })
        ),

        /* Posts */
        postsLoading ? (
          React.createElement(
            "div",
            { className: "flex justify-center py-12" },
            React.createElement(Loader2, { size: 24, className: "animate-spin text-brand-500" })
          )
        ) : posts.length === 0 ? (
          React.createElement(
            "div",
            { className: "card p-10 text-center" },
            React.createElement("p", { className: "text-3xl mb-2" }, "💬"),
            React.createElement("p", { className: "text-sm font-semibold text-surface-900 mb-1" }, "No posts yet"),
            React.createElement(
              "p",
              { className: "text-xs text-surface-400" },
              community.isMember ? "Be the first to post!" : "Join to start posting."
            )
          )
        ) : (
          React.createElement(
            "div",
            { className: "space-y-3" },
            posts.map(function(post) {
              return React.createElement(PostCard, {
                key: post._id,
                post: post,
                onDelete: function(postId) {
                  setPosts(function(prev) {
                    return prev.filter(function(p) { return p._id !== postId; });
                  });
                }
              });
            })
          )
        )
      )
    )
  );
}
