"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Users, Hash, Lock, Loader2, ArrowLeft,
  MessageSquare, CheckCircle2, ChevronRight
} from "lucide-react";
import { communityApi, type Community, type Channel } from "@/lib/api/community.api";
import { feedApi, type Post } from "@/lib/api/feed.api";
import { PostComposer } from "@/components/posts/PostComposer";
import { PostCard }     from "@/components/posts/PostCard";
import { Button }       from "@/components/ui/Button";
import { formatCount }  from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/client";
import Link from "next/link";
import toast from "react-hot-toast";

var AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#3b82f6,#6366f1)",
  "linear-gradient(135deg,#10b981,#3b82f6)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
  "linear-gradient(135deg,#14b8a6,#6366f1)"
];
function getGradient(name: string) {
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

var CHANNEL_TYPE_ICON: Record<string, string> = {
  announcement: "📢",
  resource:     "📚",
  text:         ""
};

export default function CommunityPage() {
  var params = useParams();
  var router = useRouter();
  var slug   = params.slug as string;

  var [community,     setCommunity]     = useState<Community | null>(null);
  var [posts,         setPosts]         = useState<Post[]>([]);
  var [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  var [loading,       setLoading]       = useState(true);
  var [postsLoading,  setPostsLoading]  = useState(false);
  var [joining,       setJoining]       = useState(false);
  var [error,         setError]         = useState("");

  useEffect(function() {
    if (!slug) return;
    setLoading(true);
    communityApi.getCommunity(slug)
      .then(function(res) {
        var c = res.data.data;
        setCommunity(c);
        if (c.channels && c.channels.length > 0) setActiveChannel(c.channels[0]);
      })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); });
  }, [slug]);

  useEffect(function() {
    if (!slug) return;
    setPostsLoading(true);
    communityApi.getCommunityFeed(slug, activeChannel ? activeChannel._id : null, 1)
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
        return Object.assign({}, prev, { isMember: true, memberCount: prev.memberCount + 1 });
      });
      toast.success("Joined " + community.name + "!");
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setJoining(false); }
  }

  async function handleLeave() {
    if (!community) return;
    if (!confirm("Leave " + community.name + "?")) return;
    try {
      await communityApi.leaveCommunity(community._id);
      setCommunity(function(prev) {
        if (!prev) return prev;
        return Object.assign({}, prev, { isMember: false, memberCount: Math.max(0, prev.memberCount - 1) });
      });
      toast.success("Left " + community.name);
    } catch(err) { toast.error(getErrorMessage(err)); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-brand-500" />
        </div>
        <p className="text-sm text-surface-400 font-medium">Loading community...</p>
      </div>
    </div>
  );

  if (error || !community) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="card p-10">
        <p className="text-base font-black text-surface-900 mb-1.5 tracking-tight">Community not found</p>
        <p className="text-sm text-surface-400 mb-6">{error}</p>
        <Button variant="secondary" onClick={function() { router.push("/communities"); }}
          leftIcon={<ArrowLeft size={14} />}>
          Back to communities
        </Button>
      </div>
    </div>
  );

  var grad = getGradient(community.name);

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Channel sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-white border-r border-surface-200 flex-col">

        <div className="shrink-0">
          <div className="h-14 relative" style={{ background: grad }}>
            {community.coverImageUrl && (
              <img src={community.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.3))" }} />
          </div>

          <div className="px-4 pt-0 pb-3 -mt-5">
            <div className="flex items-end gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black ring-2 ring-white shadow-md"
                style={{ background: grad }}>
                {community.iconUrl
                  ? <img src={community.iconUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                  : community.name.slice(0, 2).toUpperCase()
                }
              </div>
              <div className="min-w-0 flex-1 pb-0.5">
                <h2 className="text-xs font-black text-surface-900 truncate tracking-tight">{community.name}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="flex items-center gap-1 text-[10px] text-surface-400 font-medium">
                    <Users size={9} />{formatCount(community.memberCount)}
                  </span>
                  {community.isPrivate && (
                    <span className="flex items-center gap-0.5 text-[10px] text-surface-400">
                      <Lock size={9} />Private
                    </span>
                  )}
                </div>
              </div>
            </div>

            {community.isMember ? (
              <button onClick={handleLeave}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-surface-500 bg-surface-100 hover:bg-red-50 hover:text-red-600 border border-surface-200 hover:border-red-200 transition-all">
                Leave community
              </button>
            ) : (
              <button onClick={handleJoin} disabled={joining}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:shadow-md"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                {joining
                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><CheckCircle2 size={11} />Join community</>
                }
              </button>
            )}
          </div>

          <div className="px-4 pb-3 border-b border-surface-100">
            <Link href="/communities"
              className="flex items-center gap-1.5 text-[10px] text-surface-400 hover:text-brand-600 font-bold transition-colors uppercase tracking-wider">
              <ArrowLeft size={10} />All communities
            </Link>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <p className="text-[9px] font-black text-surface-400 uppercase tracking-widest px-3 mb-2">Channels</p>
          {community.channels.map(function(channel) {
            var isActive = activeChannel && activeChannel._id === channel._id;
            var typeIcon = CHANNEL_TYPE_ICON[channel.type] || "";
            return (
              <button key={channel._id}
                onClick={function() { setActiveChannel(channel); }}
                className={[
                  "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 text-left group",
                  isActive
                    ? "bg-brand-50 text-brand-700 font-bold"
                    : "text-surface-600 hover:bg-surface-100 hover:text-surface-900 font-medium"
                ].join(" ")}>
                {typeIcon
                  ? <span className="text-sm leading-none shrink-0">{typeIcon}</span>
                  : <Hash size={12} className={isActive ? "text-brand-500 shrink-0" : "text-surface-400 shrink-0"} />
                }
                <span className="flex-1 truncate">{channel.name}</span>
                {channel.isPrivate && <Lock size={9} className="text-surface-400 shrink-0" />}
                {isActive && <ChevronRight size={10} className="text-brand-400 shrink-0" />}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Channel header */}
        <div className="shrink-0 bg-white border-b border-surface-200 px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={function() { router.push("/communities"); }}
              className="md:hidden w-7 h-7 rounded-lg bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition-colors shrink-0">
              <ArrowLeft size={14} className="text-surface-500" />
            </button>
            {activeChannel ? (
              <>
                <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                  <Hash size={14} className="text-brand-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm font-black text-surface-900 truncate">{activeChannel.name}</h1>
                    {activeChannel.type !== "text" && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                        style={{ background: "#eef2ff", color: "#4338ca" }}>
                        {activeChannel.type}
                      </span>
                    )}
                  </div>
                  {activeChannel.description && (
                    <p className="text-[11px] text-surface-400 truncate">{activeChannel.description}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                  style={{ background: grad }}>
                  {community.name.slice(0, 2).toUpperCase()}
                </div>
                <h1 className="text-sm font-black text-surface-900">{community.name}</h1>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-100 border border-surface-200">
              <Users size={11} className="text-surface-500" />
              <span className="text-xs font-bold text-surface-600">{formatCount(community.memberCount)}</span>
            </div>
            {community.isMember ? (
              <button onClick={handleLeave}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-surface-500 bg-surface-100 hover:bg-red-50 hover:text-red-600 border border-surface-200 hover:border-red-200 transition-all">
                Leave
              </button>
            ) : (
              <button onClick={handleJoin} disabled={joining}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:shadow-md"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                {joining
                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><CheckCircle2 size={11} />Join</>
                }
              </button>
            )}
          </div>
        </div>

        {/* Scrollable feed */}
        <div className="flex-1 overflow-y-auto bg-surface-50">
          <div className="max-w-2xl mx-auto px-4 py-6">

            {community.isMember && (
              <div className="mb-5">
                <PostComposer
                  communityId={community._id}
                  channelId={activeChannel ? activeChannel._id : undefined}
                  onPostCreated={function(post) { setPosts(function(prev) { return [post, ...prev]; }); }}
                />
              </div>
            )}

            {!community.isMember && (
              <div className="mb-5 rounded-2xl overflow-hidden border border-brand-200"
                style={{ background: "linear-gradient(135deg,#eef2ff 0%,#f0f9ff 100%)" }}>
                <div className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-surface-900 mb-1">Join to participate</p>
                    <p className="text-xs text-surface-500">Become a member to post, comment, and connect.</p>
                  </div>
                  <button onClick={handleJoin} disabled={joining}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shrink-0 transition-all hover:shadow-md"
                    style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                    {joining
                      ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <><CheckCircle2 size={12} />Join now</>
                    }
                  </button>
                </div>
              </div>
            )}

            {postsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin text-brand-500" />
                </div>
                <p className="text-sm text-surface-400 font-medium">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="card p-14 text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare size={18} className="text-surface-400" />
                </div>
                <p className="text-sm font-black text-surface-900 mb-1.5 tracking-tight">No posts yet</p>
                <p className="text-xs text-surface-400">
                  {community.isMember ? "Be the first to post in this channel!" : "Join the community to start posting."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(function(post) {
                  return (
                    <PostCard key={post._id} post={post}
                      onDelete={function(postId) {
                        setPosts(function(prev) { return prev.filter(function(p) { return p._id !== postId; }); });
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}