"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar, Users, Loader2, Edit2,
  MapPin, Globe, Twitter, Linkedin, Github,
  TrendingUp, Star, ShieldCheck, UserPlus, UserCheck,
  Award, Zap, Clock, ThumbsUp, Settings
} from "lucide-react";
import Link from "next/link";
import { profileApi, type ReputationHistory } from "@/lib/api/profile.api";
import { getErrorMessage }     from "@/lib/api/client";
import { useAuthStore }        from "@/lib/store/auth.store";
import { AvatarUpload }        from "@/components/profile/AvatarUpload";
import { Button }              from "@/components/ui/Button";
import { getInitials, getAvatarColor } from "@/lib/utils";
import toast from "react-hot-toast";

/* ── Backend profile shape (actual API response) ─────────────── */
type BackendProfile = {
  _id:                  string;
  userId:               string;
  name?:                string;
  avatar:               string | null;
  bio:                  string;
  location:             string;
  website:              string;
  skills:               string[];
  interests:            string[];
  reputation:           number;
  tier:                 string;
  helpfulVotesReceived: number;
  completionPercentage: number;
  badges:               string[];
  joinedAt:             string;
  socialLinks:          { twitter?: string; linkedin?: string; github?: string };
};

var TIER_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  free:    { label: "Free",      bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  premium: { label: "Premium",   bg: "#eef2ff", color: "#4338ca", border: "#c7d2fe" },
  mod:     { label: "Moderator", bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" }
};

var TABS = [
  { id: "overview",   label: "Overview"   },
  { id: "reputation", label: "Reputation" },
  { id: "badges",     label: "Badges"     }
];

/* ── Helpers ─────────────────────────────────────────────────── */
function getSeniority(joinedAt: string): string {
  var ms     = Date.now() - new Date(joinedAt).getTime();
  var months = Math.floor(ms / (1000 * 60 * 60 * 24 * 30));
  if (months < 1)  return "New member";
  if (months < 12) return months + " month" + (months > 1 ? "s" : "") + " in community";
  var years = Math.floor(months / 12);
  var rem   = months % 12;
  return years + " yr" + (years > 1 ? "s" : "") + (rem > 0 ? " " + rem + " mo" : "") + " in community";
}

function timeAgo(dateStr: string): string {
  var diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)     return "just now";
  if (diff < 3600)   return Math.floor(diff / 60) + "m ago";
  if (diff < 86400)  return Math.floor(diff / 3600) + "h ago";
  if (diff < 604800) return Math.floor(diff / 86400) + "d ago";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ════════════════════════════════════════════════════════════════
   ProfilePage — Gaps fixed: A-1, B-1, B-2, B-3, B-4, B-5, X-6
════════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  var params       = useParams();
  var router       = useRouter();
  var { user }     = useAuthStore();
  var userId       = params.userId as string;
  var isOwnProfile = !!(user && user._id === userId);   /* FIX A-1 / X-6 */

  var [profile,    setProfile]    = useState<BackendProfile | null>(null);
  var [loading,    setLoading]    = useState(true);
  var [error,      setError]      = useState("");
  var [activeTab,  setActiveTab]  = useState("overview");

  /* ── Reputation history (lazy — Gap B-1) ─────────────────── */
  var [repHistory, setRepHistory] = useState<ReputationHistory[]>([]);
  var [repLoading, setRepLoading] = useState(false);
  var [repLoaded,  setRepLoaded]  = useState(false);

  /* ── Follow state (Gap B-2) ──────────────────────────────── */
  var [isFollowing,    setIsFollowing]    = useState(false);
  var [followersCount, setFollowersCount] = useState(0);
  var [followLoading,  setFollowLoading]  = useState(false);

  /* ── Load profile ────────────────────────────────────────── */
  useEffect(function() {
    if (!userId) return;
    setLoading(true);
    setError("");
    setProfile(null);
    setRepLoaded(false);
    setRepHistory([]);
    setActiveTab("overview");

    var apiCall = isOwnProfile
      ? profileApi.getMyProfile()
      : profileApi.getProfile(userId);   /* FIX B-3 — calls correct endpoint */

    apiCall
      .then(function(res) {
        var body = res.data as unknown as { data: { profile: BackendProfile } };
        setProfile(body.data.profile);
      })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); });

    /* Fetch follow status for other profiles (Gap B-2) */
    if (!isOwnProfile && user) {
      profileApi.getFollowStatus(userId)
        .then(function(res) {
          var d = (res.data as any).data ?? (res.data as any);
          setIsFollowing(!!d.isFollowing);
          setFollowersCount(d.followersCount ?? 0);
        })
        .catch(function() { /* graceful — does not break page */ });
    }
  }, [userId, isOwnProfile, user]);

  /* ── Load reputation history (Gap B-1) ──────────────────── */
  var loadRepHistory = useCallback(function() {
    if (repLoaded || repLoading) return;
    setRepLoading(true);
    profileApi.getReputationHistory(userId)
      .then(function(res) {
        var d = (res.data as any).data ?? (res.data as any);
        setRepHistory(Array.isArray(d) ? d : []);
        setRepLoaded(true);
      })
      .catch(function() { setRepLoaded(true); })
      .finally(function() { setRepLoading(false); });
  }, [userId, repLoaded, repLoading]);

  function handleTabChange(tabId: string) {
    setActiveTab(tabId);
    if (tabId === "reputation") loadRepHistory();
  }

  /* ── Follow / Unfollow (Gap B-2) ────────────────────────── */
  async function handleFollowToggle() {
    if (!user) { router.push("/login"); return; }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        var r1 = await profileApi.unfollowUser(userId);
        var d1 = (r1.data as any).data ?? (r1.data as any);
        setIsFollowing(false);
        setFollowersCount(d1.followersCount ?? Math.max(0, followersCount - 1));
        toast("Unfollowed");
      } else {
        var r2 = await profileApi.followUser(userId);
        var d2 = (r2.data as any).data ?? (r2.data as any);
        setIsFollowing(true);
        setFollowersCount(d2.followersCount ?? followersCount + 1);
        toast.success("Following!");
      }
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setFollowLoading(false); }
  }

  /* ── Loading / Error states ──────────────────────────────── */
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={28} className="animate-spin text-brand-500" />
        <p className="text-sm text-surface-400 font-medium">Loading profile...</p>
      </div>
    </div>
  );

  if (error || !profile) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center p-8 rounded-2xl border border-surface-100 bg-white max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
          <Users size={20} className="text-red-400" />
        </div>
        <p className="font-bold text-surface-900 mb-1">Profile not found</p>
        <p className="text-sm text-surface-500">{error}</p>
      </div>
    </div>
  );

  var displayName  = (isOwnProfile ? user?.name  : profile.name)  || "Member";
  var displayEmail =  isOwnProfile ? user?.email : undefined;
  var joinDate     = new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  var seniority    = getSeniority(profile.joinedAt);    /* Gap B-4 */
  var tierKey      = profile.tier || "free";
  var tierCfg      = TIER_CONFIG[tierKey] || TIER_CONFIG["free"];
  var repScore     = profile.reputation || 0;
  var pct          = profile.completionPercentage || 0;
  var initials     = getInitials(displayName);
  var avatarBg     = getAvatarColor(displayName);
  var isMod        = !!(user && (user.role === "moderator" || user.role === "admin" || user.role === "super_admin"));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ════════════ LEFT COLUMN ════════════ */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card-lg p-6">

            {/* Cover strip */}
            <div className="h-16 -mx-6 -mt-6 mb-0 rounded-t-[1rem] overflow-hidden"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }} />

            <div className="-mt-8 flex flex-col items-center text-center">

              {/* Avatar — editable only on own profile */}
              {isOwnProfile ? (
                <AvatarUpload
                  name={displayName}
                  currentAvatarUrl={profile.avatar || undefined}
                  size={80}
                  onUploadComplete={function(url) {
                    setProfile(function(prev) { return prev ? Object.assign({}, prev, { avatar: url }) : prev; });
                  }}
                />
              ) : (
                profile.avatar
                  ? <img src={profile.avatar} alt={displayName}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-lg" />
                  : (
                    <div className={"w-20 h-20 rounded-full ring-4 ring-white shadow-lg flex items-center justify-center text-xl font-black text-white " + avatarBg}>
                      {initials}
                    </div>
                  )
              )}

              <div className="mt-3 mb-2">
                <h1 className="text-lg font-black text-surface-900 tracking-tight">{displayName}</h1>
                {displayEmail && <p className="text-xs text-surface-500 font-medium">{displayEmail}</p>}
              </div>

              {/* Seniority pill — Gap B-4 */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-1.5"
                style={{ background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}>
                <Clock size={9} />{seniority}
              </div>

              {/* Reputation pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-1.5"
                style={{ background: "#eef2ff", color: "#4338ca", border: "1px solid #c7d2fe" }}>
                <ShieldCheck size={10} />{repScore} rep pts
              </div>

              {/* Tier pill */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: tierCfg.bg, color: tierCfg.color, border: "1px solid " + tierCfg.border }}>
                <Star size={9} />{tierCfg.label} member
              </span>

              {/* Moderator role pill (own profile) */}
              {isOwnProfile && user && ["moderator","admin","super_admin"].includes(user.role) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold mt-1.5"
                  style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
                  <ShieldCheck size={9} />
                  {user.role === "super_admin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Moderator"}
                </span>
              )}

              {/* CTA — edit (own) vs follow (other) */}
              {isOwnProfile ? (
                <Link href="/settings" className="w-full mt-4">
                  <Button variant="secondary" size="sm" leftIcon={<Settings size={12} />} className="w-full">
                    Edit profile
                  </Button>
                </Link>
              ) : (
                <div className="mt-4 w-full space-y-1.5">
                  <Button
                    variant={isFollowing ? "secondary" : "primary"}
                    size="sm"
                    fullWidth
                    loading={followLoading}
                    leftIcon={isFollowing ? <UserCheck size={13} /> : <UserPlus size={13} />}
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  {followersCount > 0 && (
                    <p className="text-[10px] text-surface-400 text-center font-medium">
                      {followersCount.toLocaleString()} follower{followersCount !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-4 pt-4 text-sm text-surface-600 leading-relaxed border-t border-surface-100 text-center">
                {profile.bio}
              </p>
            )}

            {/* Meta row */}
            <div className="mt-4 pt-4 border-t border-surface-100 space-y-2">
              {profile.location && (
                <div className="flex items-center gap-2 text-xs text-surface-500">
                  <MapPin size={12} className="text-surface-400 shrink-0" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-2 text-xs">
                  <Globe size={12} className="text-surface-400 shrink-0" />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer"
                    className="text-brand-600 hover:text-brand-700 transition-colors truncate font-medium">
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-surface-500">
                <Calendar size={12} className="text-surface-400 shrink-0" />
                <span>Joined {joinDate}</span>
              </div>
            </div>

            {/* Social links */}
            {(profile.socialLinks?.twitter || profile.socialLinks?.linkedin || profile.socialLinks?.github) && (
              <div className="mt-4 pt-4 border-t border-surface-100 flex gap-2">
                {profile.socialLinks.twitter && (
                  <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-surface-100 hover:bg-blue-50 border border-surface-200 flex items-center justify-center transition-colors">
                    <Twitter size={13} className="text-surface-500" />
                  </a>
                )}
                {profile.socialLinks.linkedin && (
                  <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-surface-100 hover:bg-blue-50 border border-surface-200 flex items-center justify-center transition-colors">
                    <Linkedin size={13} className="text-surface-500" />
                  </a>
                )}
                {profile.socialLinks.github && (
                  <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-surface-100 hover:bg-surface-200 border border-surface-200 flex items-center justify-center transition-colors">
                    <Github size={13} className="text-surface-500" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Profile strength card (own profile only) */}
          {isOwnProfile && pct < 100 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={13} className="text-amber-500" />
                  <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Profile strength</h3>
                </div>
                <span className="text-xs font-black text-brand-600">{pct}%</span>
              </div>
              <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: pct + "%",
                    background: pct < 40
                      ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                      : pct < 80
                        ? "linear-gradient(90deg,#6366f1,#8b5cf6)"
                        : "linear-gradient(90deg,#10b981,#34d399)"
                  }} />
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { label: "Avatar photo",  done: !!profile.avatar },
                  { label: "Bio",           done: !!profile.bio },
                  { label: "Location",      done: !!profile.location },
                  { label: "Skills added",  done: profile.skills.length > 0 },
                  { label: "Interests set", done: profile.interests.length > 0 }
                ].map(function(item) {
                  return (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={"w-1.5 h-1.5 rounded-full shrink-0 " + (item.done ? "bg-emerald-500" : "bg-surface-300")} />
                      <span className={"text-xs font-medium " + (item.done ? "text-surface-400 line-through" : "text-surface-600")}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ════════════ RIGHT COLUMN ════════════ */}
        <div className="lg:col-span-2 space-y-4">

          {/* Tab bar */}
          <div className="flex gap-1 bg-white border border-surface-200 rounded-xl p-1 shadow-card">
            {TABS.map(function(tab) {
              return (
                <button key={tab.id}
                  onClick={function() { handleTabChange(tab.id); }}
                  className={[
                    "flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-150",
                    activeTab === tab.id
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-surface-500 hover:bg-surface-100 hover:text-surface-900"
                  ].join(" ")}>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ─────── OVERVIEW TAB ─────── */}
          {activeTab === "overview" && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Reputation",    value: repScore,                          icon: <ShieldCheck size={15} className="text-brand-500" />   },
                  { label: "Helpful votes", value: profile.helpfulVotesReceived || 0, icon: <ThumbsUp    size={15} className="text-emerald-500" /> }
                ].map(function(stat) {
                  return (
                    <div key={stat.label} className="card p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-50 border border-surface-100 flex items-center justify-center shrink-0">
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-xl font-black text-surface-900 leading-none">{stat.value.toLocaleString()}</p>
                        <p className="text-[10px] text-surface-400 font-semibold uppercase tracking-wide mt-0.5">{stat.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {profile.skills.length > 0 && (
                <div className="card p-5">
                  <h2 className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-4">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map(function(skill) {
                      return (
                        <span key={skill} className="px-3 py-1.5 rounded-full text-xs font-semibold"
                          style={{ background: "#eef2ff", color: "#4338ca", border: "1px solid #c7d2fe" }}>
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {profile.interests.length > 0 && (
                <div className="card p-5">
                  <h2 className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-4">Interests</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map(function(interest) {
                      return (
                        <span key={interest} className="px-3 py-1.5 rounded-full text-xs font-semibold"
                          style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}>
                          {interest}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1.5">Membership</h2>
                    <p className="text-sm font-bold text-surface-900 mb-0.5">{tierCfg.label} Plan</p>
                    <p className="text-xs text-surface-500">
                      {tierKey === "free"
                        ? "Free plan — upgrade to unlock premium features"
                        : tierKey === "premium"
                          ? "Premium member — full platform access"
                          : "Moderator — community steward"}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0"
                    style={{ background: tierCfg.bg, color: tierCfg.color, border: "1px solid " + tierCfg.border }}>
                    <Star size={11} />{tierCfg.label}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ─────── REPUTATION TAB — Gap B-1 ─────── */}
          {activeTab === "reputation" && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Reputation History</h2>
                <span className="px-2.5 py-1 rounded-full text-xs font-black"
                  style={{ background: "#eef2ff", color: "#4338ca", border: "1px solid #c7d2fe" }}>
                  {repScore.toLocaleString()} total pts
                </span>
              </div>

              {repLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={22} className="animate-spin text-brand-400" />
                </div>
              ) : repHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
                    <Zap size={18} className="text-surface-400" />
                  </div>
                  <p className="text-sm font-semibold text-surface-700 mb-1">No reputation history yet</p>
                  <p className="text-xs text-surface-400">Engage with the community to earn reputation points.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {repHistory.map(function(item) {
                    var isPositive = item.points >= 0;
                    return (
                      <div key={item._id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors border border-transparent hover:border-surface-100">
                        <div className={"w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-black " +
                          (isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>
                          {isPositive ? "+" : ""}{item.points}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-surface-800 truncate">{item.action}</p>
                          {item.description && (
                            <p className="text-[10px] text-surface-400 truncate">{item.description}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-surface-400 shrink-0 font-medium">
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─────── BADGES TAB — Gap B-5 ─────── */}
          {activeTab === "badges" && (
            <div className="card p-5">
              <h2 className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-5">
                Badges &amp; Achievements
              </h2>

              {(!profile.badges || profile.badges.length === 0) ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
                    <Award size={18} className="text-surface-400" />
                  </div>
                  <p className="text-sm font-semibold text-surface-700 mb-1">No badges earned yet</p>
                  <p className="text-xs text-surface-400">
                    Contribute to the community to unlock badges.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {profile.badges.map(function(badge) {
                    return (
                      <div key={badge}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all hover:shadow-sm"
                        style={{ background: "#fefce8", border: "1px solid #fde68a" }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                          <Award size={18} className="text-white" />
                        </div>
                        <span className="text-xs font-bold text-amber-800 leading-tight">{badge}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Moderator role badge — Gap B-5 */}
              {isOwnProfile && isMod && (
                <div className="mt-5 pt-4 border-t border-surface-100">
                  <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-3">
                    Platform Role
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
                      <ShieldCheck size={11} />
                      {user?.role === "super_admin"
                        ? "Super Admin"
                        : user?.role === "admin"
                          ? "Platform Admin"
                          : "Community Moderator"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}