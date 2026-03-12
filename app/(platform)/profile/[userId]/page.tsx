"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar, MessageCircle, FileText,
  Users, Loader2, Edit2,
  MapPin, Globe, Twitter, Linkedin, Github,
  TrendingUp, Star, ShieldCheck
} from "lucide-react";
import { profileApi }          from "@/lib/api/profile.api";
import { getErrorMessage }     from "@/lib/api/client";
import { useAuthStore }        from "@/lib/store/auth.store";
import { ProfileCompleteness } from "@/components/profile/ProfileCompleteness";
import { AvatarUpload }        from "@/components/profile/AvatarUpload";
import { Button }              from "@/components/ui/Button";
import { getInitials, getAvatarColor } from "@/lib/utils";
import toast from "react-hot-toast";

/* ── Actual backend shape ─────────────────────────────────────── */
type BackendProfile = {
  _id: string;
  userId: string;
  avatar: string | null;
  bio: string;
  location: string;
  website: string;
  skills: string[];
  interests: string[];
  reputation: number;
  tier: string;
  helpfulVotesReceived: number;
  completionPercentage: number;
  badges: string[];
  joinedAt: string;
  socialLinks: { twitter?: string; linkedin?: string; github?: string };
};

var TIER_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  free:    { label: "Free",      bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  premium: { label: "Premium",   bg: "#eef2ff", color: "#4338ca", border: "#c7d2fe" },
  mod:     { label: "Moderator", bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" }
};

export default function ProfilePage() {
  var { user } = useAuthStore();

  var [profile, setProfile] = useState<BackendProfile | null>(null);
  var [loading, setLoading] = useState(true);
  var [error,   setError]   = useState("");

  useEffect(function() {
    setLoading(true);
    profileApi.getMyProfile()
      .then(function(res) {
        var body = res.data as { data: { profile: BackendProfile } };
        setProfile(body.data.profile);
      })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); });
  }, []);

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

  var displayName = user?.name  || "Member";
  var displayEmail= user?.email || "";
  var joinDate    = new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  var tierKey     = profile.tier || "free";
  var tierCfg     = TIER_CONFIG[tierKey] || TIER_CONFIG["free"];
  var repScore    = profile.reputation || 0;
  var pct         = profile.completionPercentage || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT COLUMN ─────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Identity card */}
          <div className="card-lg p-6">
            {/* Cover gradient */}
            <div className="h-16 -mx-6 -mt-6 mb-0 rounded-t-[1rem] overflow-hidden"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }} />

            <div className="-mt-8 flex flex-col items-center text-center">
              <AvatarUpload
                name={displayName}
                currentAvatarUrl={profile.avatar || undefined}
                size={80}
                onUploadComplete={function(url) {
                  setProfile(function(prev) { return prev ? Object.assign({}, prev, { avatar: url }) : prev; });
                }}
              />

              <div className="mt-3 mb-3">
                <h1 className="text-lg font-black text-surface-900 tracking-tight">{displayName}</h1>
                <p className="text-xs text-surface-500 font-medium">{displayEmail}</p>
              </div>

              {/* Rep pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2"
                style={{ background: "#eef2ff", color: "#4338ca", border: "1px solid #c7d2fe" }}>
                <ShieldCheck size={10} />
                {repScore} reputation pts
              </div>

              {/* Tier pill */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: tierCfg.bg, color: tierCfg.color, border: "1px solid " + tierCfg.border }}>
                <Star size={9} />{tierCfg.label} member
              </span>

              {user?.role && ["moderator","admin","super_admin"].includes(user.role) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold mt-1.5"
                  style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
                  <ShieldCheck size={9} />
                  {user.role === "super_admin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Moderator"}
                </span>
              )}

              <Button variant="secondary" size="sm" leftIcon={<Edit2 size={12} />}
                className="mt-4 w-full"
                onClick={function() { toast("Profile editing available in settings."); }}>
                Edit profile
              </Button>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-4 pt-4 text-sm text-surface-600 leading-relaxed border-t border-surface-100 text-center">
                {profile.bio}
              </p>
            )}

            {/* Meta */}
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

          {/* Profile strength card */}
          {pct < 100 && (
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

        {/* ── RIGHT COLUMN ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

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

          {/* Membership */}
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

          {/* Badges */}
          {profile.badges && profile.badges.length > 0 && (
            <div className="card p-5">
              <h2 className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-4">Badges</h2>
              <div className="flex flex-wrap gap-2">
                {profile.badges.map(function(badge) {
                  return (
                    <span key={badge} className="px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fcd34d" }}>
                      {badge}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}