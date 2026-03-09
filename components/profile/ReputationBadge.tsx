"use client";

import React from "react";

type ReputationLevel = "newcomer" | "contributor" | "trusted" | "expert" | "legend";

type ReputationBadgeProps = {
  level: ReputationLevel;
  score: number;
  size?: "sm" | "md" | "lg";
};

var levelConfig: Record<ReputationLevel, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
}> = {
  newcomer:    { label: "Newcomer",    icon: "🌱", color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1" },
  contributor: { label: "Contributor", icon: "⚡", color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc" },
  trusted:     { label: "Trusted",     icon: "🔷", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" },
  expert:      { label: "Expert",      icon: "🏆", color: "#b45309", bg: "#fef3c7", border: "#fcd34d" },
  legend:      { label: "Legend",      icon: "💎", color: "#be185d", bg: "#fdf2f8", border: "#f9a8d4" }
};

export function ReputationBadge({ level, score, size = "md" }: ReputationBadgeProps) {
  var config = levelConfig[level];
  var sizeStyles: Record<string, React.CSSProperties> = {
    sm: { fontSize: "0.7rem",  padding: "2px 8px",  gap: "3px" },
    md: { fontSize: "0.75rem", padding: "4px 10px", gap: "4px" },
    lg: { fontSize: "0.875rem",padding: "6px 14px", gap: "6px" }
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: sizeStyles[size]?.gap,
        padding: sizeStyles[size]?.padding,
        borderRadius: "9999px",
        fontSize: sizeStyles[size]?.fontSize,
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
        border: "1px solid " + config.border,
        whiteSpace: "nowrap"
      }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {size !== "sm" && (
        <span
          style={{
            background: config.border,
            color: config.color,
            borderRadius: "9999px",
            padding: "1px 6px",
            fontSize: "0.65rem",
            fontWeight: 700
          }}
        >
          {score} pts
        </span>
      )}
    </span>
  );
}
