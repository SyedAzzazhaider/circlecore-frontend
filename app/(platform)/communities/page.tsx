"use client";

import React, { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { communityApi, type Community } from "@/lib/api/community.api";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/lib/api/client";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth.store";
import toast from "react-hot-toast";

export default function CommunitiesPage() {
  var [communities, setCommunities] = useState<Community[]>([]);
  var [loading,     setLoading]     = useState(true);
  var [loadingMore, setLoadingMore] = useState(false);
  var [error,       setError]       = useState("");
  var [page,        setPage]        = useState(1);
  var [hasMore,     setHasMore]     = useState(false);
  var [joining,     setJoining]     = useState<string | null>(null);
  var { user }                      = useAuthStore();

  function loadCommunities(p: number, replace: boolean) {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    communityApi
      .getCommunities(p)
      .then(function(res) {
        var raw  = res.data as any;
        var list: Community[] = [];
        if (Array.isArray(raw))                           list = raw;
        else if (Array.isArray(raw.data))                 list = raw.data;
        else if (raw.data && Array.isArray(raw.data.data)) list = raw.data.data;

        if (replace) setCommunities(list);
        else         setCommunities(function(prev) { return [...prev, ...list]; });

        var meta = raw.data || raw;
        setHasMore(meta && meta.totalPages ? p < meta.totalPages : false);
        setPage(p);
      })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); setLoadingMore(false); });
  }

  useEffect(function() { loadCommunities(1, true); }, []);

  async function handleJoin(slug: string, isMember: boolean) {
    setJoining(slug);
    try {
      if (isMember) {
        await communityApi.leaveCommunity(slug);
        setCommunities(function(prev) {
          return prev.map(function(c) {
            return c.slug === slug ? { ...c, isMember: false, memberCount: c.memberCount - 1 } : c;
          });
        });
        toast("Left community");
      } else {
        await communityApi.joinCommunity(slug);
        setCommunities(function(prev) {
          return prev.map(function(c) {
            return c.slug === slug ? { ...c, isMember: true, memberCount: c.memberCount + 1 } : c;
          });
        });
        toast.success("Joined community!");
      }
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setJoining(null); }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
          <Users size={18} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 leading-tight">Communities</h1>
          <p className="text-sm text-surface-500">Discover and join curated invite-only communities.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand-500 mb-3" />
          <p className="text-sm text-surface-400">Loading communities...</p>
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-sm font-semibold text-surface-900 mb-1">Could not load communities</p>
          <p className="text-xs text-surface-400 mb-4">{error}</p>
          <Button variant="secondary" size="sm" onClick={function() { loadCommunities(1, true); }}>Try again</Button>
        </div>
      ) : communities.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🏘️</p>
          <p className="text-sm font-semibold text-surface-900 mb-1">No communities yet</p>
          <p className="text-xs text-surface-400">Communities will appear here once created by an admin.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communities.map(function(community) {
              var isJoining = joining === community.slug;
              return (
                <div key={community._id} className="card p-5 flex flex-col gap-3 hover:border-surface-300 transition-all duration-150">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0 overflow-hidden">
                        {community.iconUrl
                          ? <img src={community.iconUrl} alt={community.name} className="w-full h-full object-cover" />
                          : community.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-surface-900 leading-tight">{community.name}</h3>
                        <p className="text-xs text-surface-400 mt-0.5">#{community.slug}</p>
                      </div>
                    </div>
                    {community.isMember && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 shrink-0">
                        Joined
                      </span>
                    )}
                    {community.isPending && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                        Pending
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-surface-500 leading-relaxed line-clamp-2">
                    {community.description || "No description provided."}
                  </p>

                  {community.tags && community.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {community.tags.slice(0, 3).map(function(tag) {
                        return (
                          <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-surface-100 text-surface-500 border border-surface-200">
                            #{tag}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-surface-400">
                    <span className="flex items-center gap-1">
                      <Users size={11} />{community.memberCount || 0} members
                    </span>
                    <span>{community.postCount || 0} posts</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link href={"/communities/" + community.slug} className="flex-1">
                      <Button variant="secondary" size="sm" fullWidth>View</Button>
                    </Link>
                    <Button size="sm" variant={community.isMember ? "secondary" : "primary"}
                      loading={isJoining} onClick={function() { handleJoin(community.slug, community.isMember || false); }}
                      className="flex-1">
                      {community.isMember ? "Leave" : "Join"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button variant="secondary" loading={loadingMore} onClick={function() { loadCommunities(page + 1, false); }}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}