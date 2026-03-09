"use client";

import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import type { Profile } from "@/lib/api/profile.api";

type ProfileCompletenessProps = {
  profile: Profile;
};

type CompletenessItem = {
  label: string;
  done: boolean;
};

export function ProfileCompleteness({ profile }: ProfileCompletenessProps) {
  var items: CompletenessItem[] = [
    { label: "Display name",   done: !!profile.name && profile.name.trim().length > 0 },
    { label: "Avatar photo",   done: !!profile.avatar },
    { label: "Bio",            done: !!profile.bio && profile.bio.trim().length > 0 },
    { label: "Skills added",   done: profile.skills.length > 0 },
    { label: "Interests set",  done: profile.interests.length > 0 }
  ];

  var completed = items.filter(function(i) { return i.done; }).length;
  var total     = items.length;
  var pct       = Math.round((completed / total) * 100);

  if (pct === 100) return null;

  return React.createElement(
    "div",
    { className: "card p-4" },
    React.createElement(
      "div",
      { className: "flex items-center justify-between mb-2" },
      React.createElement("h3", { className: "text-xs font-bold text-surface-900" }, "Profile completeness"),
      React.createElement("span", { className: "text-xs font-bold text-brand-600" }, pct + "%")
    ),
    React.createElement(
      "div",
      { className: "h-1.5 bg-surface-100 rounded-full mb-3 overflow-hidden" },
      React.createElement("div", {
        className: "h-full bg-brand-500 rounded-full transition-all duration-500",
        style: { width: pct + "%" }
      })
    ),
    React.createElement(
      "div",
      { className: "space-y-1.5" },
      items.map(function(item) {
        return React.createElement(
          "div",
          { key: item.label, className: "flex items-center gap-2" },
          item.done
            ? React.createElement(CheckCircle2, { size: 12, className: "text-success-500 shrink-0" })
            : React.createElement(Circle,       { size: 12, className: "text-surface-300 shrink-0" }),
          React.createElement(
            "span",
            { className: "text-xs " + (item.done ? "text-surface-400 line-through" : "text-surface-600") },
            item.label
          )
        );
      })
    )
  );
}
