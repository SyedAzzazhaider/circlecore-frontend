"use client";

import React from "react";
import { CheckCircle2, Circle, Zap } from "lucide-react";
import type { Profile } from "@/lib/api/profile.api";

type ProfileCompletenessProps = { profile: Profile };

type Item = { label: string; done: boolean };

export function ProfileCompleteness({ profile }: ProfileCompletenessProps) {
  var items: Item[] = [
    { label: "Display name",  done: !!profile.name?.trim() },
    { label: "Avatar photo",  done: !!profile.avatar },
    { label: "Bio",           done: !!profile.bio?.trim() },
    { label: "Skills added",  done: (profile.skills?.length ?? 0) > 0 },
    { label: "Interests set", done: (profile.interests?.length ?? 0) > 0 }
  ];

  var completed = items.filter(function(i) { return i.done; }).length;
  var pct       = Math.round((completed / items.length) * 100);

  if (pct === 100) return null;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={13} className="text-amber-500" />
        <div className="flex-1 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Profile strength</h3>
          <span className="text-xs font-black text-brand-600">{pct}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-surface-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: pct + "%",
            background: pct < 40
              ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
              : pct < 80
                ? "linear-gradient(90deg, #6366f1, #8b5cf6)"
                : "linear-gradient(90deg, #10b981, #34d399)"
          }}
        />
      </div>

      <div className="space-y-2">
        {items.map(function(item) {
          return (
            <div key={item.label} className="flex items-center gap-2.5">
              {item.done
                ? <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                : <Circle       size={12} className="text-surface-300 shrink-0" />
              }
              <span className={"text-xs font-medium " + (item.done ? "text-surface-400 line-through" : "text-surface-600")}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}