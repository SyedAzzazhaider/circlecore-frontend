"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Calendar, Award, MessageCircle,
  FileText, Users, Loader2, Edit2, ThumbsUp
} from "lucide-react";
import { profileApi, type Profile } from "@/lib/api/profile.api";
import { getErrorMessage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth.store";
import { ReputationBadge } from "@/components/profile/ReputationBadge";
import { ModeratorBadge } from "@/components/profile/ModeratorBadge";
import { ProfileCompleteness } from "@/components/profile/ProfileCompleteness";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { Button } from "@/components/ui/Button";
import { getInitials, getAvatarColor, formatCount } from "@/lib/utils";
import toast from "react-hot-toast";

var TIER_CONFIG: Record<string, { label: string; style: string }> = {
  standard: { label: "Standard",  style: "badge-neutral" },
  premium:  { label: "Premium",   style: "badge-brand"   },
  mod:      { label: "Moderator", style: "badge-success" }
};

export default function ProfilePage() {
  var params   = useParams();
  var userId   = params.userId as string;
  var { user } = useAuthStore();

  var [profile, setProfile] = useState<Profile | null>(null);
  var [loading, setLoading] = useState(true);
  var [error, setError]     = useState("");

  var isOwner = user && profile && user._id === profile.userId;

  useEffect(function() {
    if (!userId) return;
    setLoading(true);
    profileApi
      .getProfile(userId)
      .then(function(res) { setProfile(res.data.data); })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); });
  }, [userId]);

  if (loading) {
    return React.createElement(
      "div",
      { className: "flex items-center justify-center min-h-[60vh]" },
      React.createElement(Loader2, { size: 32, className: "animate-spin text-brand-500 mx-auto" })
    );
  }

  if (error || !profile) {
    return React.createElement(
      "div",
      { className: "flex items-center justify-center min-h-[60vh] text-center" },
      React.createElement("div", null,
        React.createElement("p", { className: "text-surface-900 font-semibold mb-1" }, "Profile not found"),
        React.createElement("p", { className: "text-sm text-surface-500" }, error)
      )
    );
  }

  var joinDate = new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  var tierCfg  = TIER_CONFIG[profile.membershipTier] || TIER_CONFIG["standard"];

  return React.createElement(
    "div",
    { className: "max-w-4xl mx-auto px-4 py-8" },
    React.createElement(
      "div",
      { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" },

      /* Left column */
      React.createElement(
        "div",
        { className: "lg:col-span-1 space-y-4" },

        /* Identity card */
        React.createElement(
          "div",
          { className: "card p-6" },
          React.createElement(
            "div",
            { className: "flex flex-col items-center text-center" },
            isOwner ? (
              React.createElement(AvatarUpload, {
                name: profile.name,
                currentAvatarUrl: profile.avatar,
                size: 88,
                onUploadComplete: function(url) {
                  setProfile(function(prev) { return prev ? Object.assign({}, prev, { avatar: url }) : prev; });
                }
              })
            ) : (
              React.createElement(
                "div",
                { className: "w-[88px] h-[88px] rounded-full flex items-center justify-center text-white font-bold text-2xl " + getAvatarColor(profile.name), style: { border: "3px solid white", boxShadow: "0 0 0 2px #e2e8f0" } },
                profile.avatar
                  ? React.createElement("img", { src: profile.avatar, alt: profile.name, className: "w-full h-full rounded-full object-cover" })
                  : getInitials(profile.name)
              )
            ),

            React.createElement("div", { className: "mt-4 mb-2" },
              React.createElement("h1", { className: "text-lg font-bold text-surface-900" }, profile.name),
              React.createElement("p", { className: "text-sm text-surface-500" }, profile.email)
            ),

            /* Badges row */
            React.createElement("div", { className: "flex flex-wrap justify-center gap-1.5 mb-3" },
              React.createElement(ReputationBadge, { level: profile.reputationLevel, score: profile.reputationScore, size: "md" }),
              user && React.createElement(ModeratorBadge, { role: user._id === profile.userId ? user.role : (profile.reputationLevel === "legend" ? "member" : "member"), size: "sm" })
            ),

            /* Membership tier */
            React.createElement(
              "span",
              { className: "badge " + tierCfg.style },
              tierCfg.label + " member"
            ),

            isOwner && React.createElement(
              Button,
              { variant: "secondary", size: "sm", leftIcon: React.createElement(Edit2, { size: 12 }), className: "mt-4 w-full", onClick: function() { toast("Profile editing coming in settings."); } },
              "Edit profile"
            )
          ),

          profile.bio && React.createElement(
            "p",
            { className: "mt-4 pt-4 text-sm text-surface-600 leading-relaxed border-t border-surface-100 text-center" },
            profile.bio
          ),

          React.createElement(
            "div",
            { className: "mt-4 pt-4 border-t border-surface-100 text-center" },
            React.createElement(
              "div",
              { className: "flex items-center justify-center gap-1.5 text-xs text-surface-500" },
              React.createElement(Calendar, { size: 12, className: "text-surface-400" }),
              "Joined " + joinDate
            )
          )
        ),

        /* Stats card */
        React.createElement(
          "div",
          { className: "card p-4" },
          React.createElement("h3", { className: "text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3" }, "Activity"),
          React.createElement(
            "div",
            { className: "space-y-3" },
            [
              { icon: FileText,      label: "Posts",          value: profile.postCount           },
              { icon: MessageCircle, label: "Comments",       value: profile.commentCount        },
              { icon: Users,         label: "Events",         value: profile.eventCount          },
              { icon: ThumbsUp,      label: "Helpful votes",  value: profile.helpfulVotesReceived },
              { icon: Award,         label: "Rep score",      value: profile.reputationScore      }
            ].map(function(stat) {
              return React.createElement(
                "div",
                { key: stat.label, className: "flex items-center justify-between" },
                React.createElement("div", { className: "flex items-center gap-2 text-sm text-surface-600" },
                  React.createElement(stat.icon, { size: 13, className: "text-surface-400" }),
                  stat.label
                ),
                React.createElement("span", { className: "text-sm font-semibold text-surface-900" }, formatCount(stat.value))
              );
            })
          )
        ),

        /* Profile completeness — only shown to owner */
        isOwner && React.createElement(ProfileCompleteness, { profile: profile })
      ),

      /* Right column */
      React.createElement(
        "div",
        { className: "lg:col-span-2 space-y-4" },

        profile.skills.length > 0 && React.createElement(
          "div",
          { className: "card p-5" },
          React.createElement("h2", { className: "text-sm font-bold text-surface-900 mb-4" }, "Skills"),
          React.createElement("div", { className: "flex flex-wrap gap-2" },
            profile.skills.map(function(skill) {
              return React.createElement("span", { key: skill, className: "px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100" }, skill);
            })
          )
        ),

        profile.interests.length > 0 && React.createElement(
          "div",
          { className: "card p-5" },
          React.createElement("h2", { className: "text-sm font-bold text-surface-900 mb-4" }, "Interests"),
          React.createElement("div", { className: "flex flex-wrap gap-2" },
            profile.interests.map(function(interest) {
              return React.createElement("span", { key: interest, className: "px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-100 text-surface-600 border border-surface-200" }, interest);
            })
          )
        ),

        React.createElement(
          "div",
          { className: "card p-5" },
          React.createElement("div", { className: "flex items-center justify-between" },
            React.createElement("div", null,
              React.createElement("h2", { className: "text-sm font-bold text-surface-900 mb-0.5" }, "Membership"),
              React.createElement("p", { className: "text-xs text-surface-500" },
                profile.membershipTier === "standard"
                  ? "Standard plan — upgrade to unlock premium features"
                  : profile.membershipTier === "premium"
                    ? "Premium member — full platform access"
                    : "Moderator — community steward"
              )
            ),
            React.createElement("span", { className: "badge " + tierCfg.style }, tierCfg.label)
          )
        )
      )
    )
  );
}
