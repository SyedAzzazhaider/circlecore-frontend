"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Users, Loader2, Search, Lock, Globe,
  Hash, Sparkles, TrendingUp, Star,
  ArrowRight, CheckCircle2
} from "lucide-react";
import { communityApi, type Community } from "@/lib/api/community.api";
import { Button }          from "@/components/ui/Button";
import { getErrorMessage } from "@/lib/api/client";
import Link from "next/link";
import toast from "react-hot-toast";

var AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#3b82f6,#6366f1)",
  "linear-gradient(135deg,#10b981,#3b82f6)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
  "linear-gradient(135deg,#14b8a6,#6366f1)",
  "linear-gradient(135deg,#f97316,#ec4899)",
  "linear-gradient(135deg,#8b5cf6,#3b82f6)"
];

function getGradient(name: string) {
  var idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

export default function CommunitiesPage() {
  var [communities, setCommunities] = useState<Community[]>([]);
  var [loading,     setLoading]     = useState(true);
  var [error,       setError]       = useState("");
  var [joining,     setJoining]     = useState<string | null>(null);
  var [search,      setSearch]      = useState("");
  var [activeTag,   setActiveTag]   = useState<string | null>(null);

  useEffect(function() {
    setLoading(true);
    communityApi.getCommunities(1)
      .then(function(res) {
        var raw = res.data as Record<string, unknown>;
        var list: Community[] = [];
        if (Array.isArray(raw))                        { list = raw as unknown as Community[]; }
        else if (Array.isArray(raw.data))              { list = raw.data as Community[]; }
        else if (raw.data && Array.isArray((raw.data as Record<string,unknown>).data)) {
          list = (raw.data as Record<string,unknown>).data as Community[];
        }
        setCommunities(list);
      })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); });
  }, []);

  async function handleJoin(slug: string, isMember: boolean) {
    setJoining(slug);
    try {
      if (isMember) {
        await communityApi.leaveCommunity(slug);
        setCommunities(function(prev) {
          return prev.map(function(c) {
            return c.slug === slug ? Object.assign({}, c, { isMember: false, memberCount: c.memberCount - 1 }) : c;
          });
        });
        toast("Left community");
      } else {
        await communityApi.joinCommunity(slug);
        setCommunities(function(prev) {
          return prev.map(function(c) {
            return c.slug === slug ? Object.assign({}, c, { isMember: true, memberCount: c.memberCount + 1 }) : c;
          });
        });
        toast.success("Joined community!");
      }
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setJoining(null); }
  }

  var allTags = useMemo(function() {
    var set = new Set<string>();
    communities.forEach(function(c) { (c.tags || []).forEach(function(t) { set.add(t); }); });
    return Array.from(set).slice(0, 10);
  }, [communities]);

  var filtered = useMemo(function() {
    return communities.filter(function(c) {
      var matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.description || "").toLowerCase().includes(search.toLowerCase());
      var matchTag    = !activeTag || (c.tags || []).includes(activeTag);
      return matchSearch && matchTag;
    });
  }, [communities, search, activeTag]);

  var joinedCount = communities.filter(function(c) { return c.isMember; }).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-1">Discover</p>
            <h1 className="text-2xl font-black text-surface-900 tracking-tight">Communities</h1>
            <p className="text-sm text-surface-500 mt-1">Find your people. Join invite-only circles built around what matters to you.</p>
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-surface-200 shadow-sm">
              <div className="w-5 h-5 rounded-lg bg-brand-50 flex items-center justify-center">
                <Globe size={11} className="text-brand-600" />
              </div>
              <div>
                <p className="text-[10px] text-surface-400 font-medium leading-none">Total</p>
                <p className="text-sm font-black text-surface-900 leading-tight">{communities.length}</p>
              </div>
            </div>
            {joinedCount > 0 && (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-50 border border-brand-200">
                <div className="w-5 h-5 rounded-lg bg-brand-100 flex items-center justify-center">
                  <CheckCircle2 size={11} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-[10px] text-brand-500 font-medium leading-none">Joined</p>
                  <p className="text-sm font-black text-brand-700 leading-tight">{joinedCount}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search communities..."
            value={search}
            onChange={function(e) { setSearch(e.target.value); }}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
          />
        </div>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <button
            onClick={function() { setActiveTag(null); }}
            className={[
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150",
              !activeTag ? "bg-brand-600 text-white shadow-sm" : "bg-white text-surface-500 border border-surface-200 hover:border-brand-300 hover:text-brand-600"
            ].join(" ")}>
            <Sparkles size={10} />All
          </button>
          {allTags.map(function(tag) {
            var active = activeTag === tag;
            return (
              <button key={tag}
                onClick={function() { setActiveTag(active ? null : tag); }}
                className={[
                  "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150",
                  active ? "bg-brand-600 text-white shadow-sm" : "bg-white text-surface-500 border border-surface-200 hover:border-brand-300 hover:text-brand-600"
                ].join(" ")}>
                <Hash size={9} />{tag}
              </button>
            );
          })}
        </div>
      )}

      {/* States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-brand-500" />
          </div>
          <p className="text-sm text-surface-400 font-medium">Loading communities...</p>
        </div>
      ) : error ? (
        <div className="card p-10 text-center max-w-sm mx-auto">
          <p className="text-sm font-bold text-surface-900 mb-1">Could not load communities</p>
          <p className="text-xs text-surface-400 mb-5">{error}</p>
          <Button variant="secondary" size="sm" onClick={function() { window.location.reload(); }}>Try again</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center max-w-sm mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <Users size={22} className="text-surface-400" />
          </div>
          <p className="text-base font-black text-surface-900 mb-1.5 tracking-tight">
            {search || activeTag ? "No results found" : "No communities yet"}
          </p>
          <p className="text-sm text-surface-400">
            {search || activeTag ? "Try a different search or filter" : "Communities will appear here once created."}
          </p>
        </div>
      ) : (
        <>
          {/* Section label */}
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={13} className="text-brand-500" />
            <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest">
              {filtered.length} {filtered.length === 1 ? "community" : "communities"}
              {(search || activeTag) ? " found" : " available"}
            </p>
          </div>

          {/* Community grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(function(community) {
              var isJoining = joining === community.slug;
              var grad      = getGradient(community.name);
              return (
                <CommunityCard
                  key={community._id}
                  community={community}
                  gradient={grad}
                  isJoining={isJoining}
                  onJoin={handleJoin}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Community Card ──────────────────────────────────────────── */
function CommunityCard({
  community, gradient, isJoining, onJoin
}: {
  community: Community;
  gradient: string;
  isJoining: boolean;
  onJoin: (slug: string, isMember: boolean) => void;
}) {
  return (
    <div className="group bg-white border border-surface-200 rounded-2xl overflow-hidden hover:border-surface-300 hover:shadow-xl hover:shadow-surface-900/[0.06] transition-all duration-300 flex flex-col">

      {/* Cover strip with gradient */}
      <div className="h-14 relative shrink-0" style={{ background: gradient }}>
        {community.coverImageUrl && (
          <img src={community.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {community.isPrivate && (
          <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: "rgba(0,0,0,0.35)", color: "white", backdropFilter: "blur(8px)" }}>
            <Lock size={8} />Private
          </div>
        )}
        {community.isMember && (
          <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: "rgba(99,102,241,0.85)", color: "white", backdropFilter: "blur(8px)" }}>
            <CheckCircle2 size={8} />Joined
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1 -mt-5">

        {/* Avatar + name */}
        <div className="flex items-end gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-black shrink-0 ring-2 ring-white shadow-lg"
            style={{ background: gradient }}>
            {community.iconUrl
              ? <img src={community.iconUrl} alt={community.name} className="w-full h-full rounded-2xl object-cover" />
              : community.name.slice(0, 2).toUpperCase()
            }
          </div>
          <div className="min-w-0 flex-1 pb-0.5">
            <h3 className="text-sm font-black text-surface-900 truncate tracking-tight group-hover:text-brand-700 transition-colors">
              {community.name}
            </h3>
            <p className="text-[10px] text-surface-400 font-medium">#{community.slug}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-surface-500 leading-relaxed line-clamp-2 mb-4 flex-1">
          {community.description || "A curated space for members to connect and share."}
        </p>

        {/* Tags */}
        {community.tags && community.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {community.tags.slice(0, 3).map(function(tag) {
              return (
                <span key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
                  <Hash size={8} />{tag}
                </span>
              );
            })}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-surface-400 mb-4 pt-3 border-t border-surface-100">
          <span className="flex items-center gap-1.5 font-semibold">
            <div className="w-4 h-4 rounded-md bg-surface-100 flex items-center justify-center">
              <Users size={9} className="text-surface-500" />
            </div>
            {(community.memberCount || 0).toLocaleString()} members
          </span>
          <span className="text-surface-300">·</span>
          <span className="flex items-center gap-1.5 font-semibold">
            <div className="w-4 h-4 rounded-md bg-surface-100 flex items-center justify-center">
              <Star size={9} className="text-surface-500" />
            </div>
            {community.postCount || 0} posts
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href={"/communities/" + community.slug} className="flex-1">
            <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-surface-600 bg-surface-100 hover:bg-surface-200 transition-all border border-surface-200 hover:border-surface-300">
              View <ArrowRight size={11} />
            </button>
          </Link>
          <button
            disabled={isJoining}
            onClick={function() { onJoin(community.slug, community.isMember || false); }}
            className={[
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150",
              community.isMember
                ? "bg-surface-100 text-surface-500 hover:bg-red-50 hover:text-red-600 border border-surface-200 hover:border-red-200"
                : "text-white border border-transparent shadow-sm hover:shadow-md hover:scale-[1.01]"
            ].join(" ")}
            style={!community.isMember ? { background: "linear-gradient(135deg,#4f46e5,#7c3aed)" } : {}}>
            {isJoining ? (
              <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : community.isMember ? "Leave" : (
              <><CheckCircle2 size={11} />Join</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}