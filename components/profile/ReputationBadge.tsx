"use client";

import React from "react";

type ReputationLevel = "newcomer" | "contributor" | "trusted" | "expert" | "legend";

type ReputationBadgeProps = {
  level: ReputationLevel;
  score: number;
  size?: "sm" | "md" | "lg";
};

var levelConfig: Record<ReputationLevel, { label: string; icon: string; color: string; bg: string; border: string; scoreBg: string }> = {
  newcomer:    { label: "Newcomer",    icon: "🌱", color: "#475569", bg: "#f1f5f9", border: "#cbd5e1", scoreBg: "#e2e8f0" },
  contributor: { label: "Contributor", icon: "⚡", color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc", scoreBg: "#bae6fd" },
  trusted:     { label: "Trusted",     icon: "🔷", color: "#6d28d9", bg: "#f5f3ff", border: "#c4b5fd", scoreBg: "#ddd6fe" },
  expert:      { label: "Expert",      icon: "🏆", color: "#b45309", bg: "#fef3c7", border: "#fcd34d", scoreBg: "#fde68a" },
  legend:      { label: "Legend",      icon: "💎", color: "#be185d", bg: "#fdf2f8", border: "#f9a8d4", scoreBg: "#fce7f3" }
};

var sizeMap = {
  sm: { fontSize: "0.68rem",  padding: "3px 8px",  gap: "3px",  scorePad: "1px 5px",  scoreFz: "0.6rem"  },
  md: { fontSize: "0.75rem",  padding: "4px 10px", gap: "4px",  scorePad: "1px 6px",  scoreFz: "0.65rem" },
  lg: { fontSize: "0.875rem", padding: "6px 14px", gap: "6px",  scorePad: "2px 8px",  scoreFz: "0.7rem"  }
};

export function ReputationBadge({ level, score, size = "md" }: ReputationBadgeProps) {
  var cfg = levelConfig[level];
  var sz  = sizeMap[size];

  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      gap: sz.gap, padding: sz.padding,
      borderRadius: "9999px", fontSize: sz.fontSize,
      fontWeight: 700, whiteSpace: "nowrap",
      backgroundColor: cfg.bg, color: cfg.color,
      border: "1px solid " + cfg.border,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
    }}>
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
      {size !== "sm" && (
        <span style={{
          background: cfg.scoreBg, color: cfg.color,
          borderRadius: "9999px", padding: sz.scorePad,
          fontSize: sz.scoreFz, fontWeight: 800
        }}>
          {score} pts
        </span>
      )}
    </span>
  );
}