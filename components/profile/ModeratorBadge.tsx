"use client";

import React from "react";
import { Shield } from "lucide-react";

type ModeratorBadgeProps = {
  role: string;
  size?: "sm" | "md";
};

export function ModeratorBadge({ role, size = "md" }: ModeratorBadgeProps) {
  if (role !== "moderator" && role !== "admin" && role !== "super_admin") {
    return null;
  }

  var label = role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : "Moderator";

  var styles: Record<string, React.CSSProperties> = {
    sm: { fontSize: "0.65rem", padding: "2px 7px", gap: "3px" },
    md: { fontSize: "0.7rem",  padding: "3px 9px", gap: "4px" }
  };

  return React.createElement(
    "span",
    {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: styles[size]?.gap,
        padding: styles[size]?.padding,
        borderRadius: "9999px",
        fontSize: styles[size]?.fontSize,
        fontWeight: 700,
        backgroundColor: role === "super_admin" ? "#fdf4ff" : role === "admin" ? "#fef2f2" : "#f0fdf4",
        color: role === "super_admin" ? "#7e22ce" : role === "admin" ? "#b91c1c" : "#15803d",
        border: "1px solid " + (role === "super_admin" ? "#e9d5ff" : role === "admin" ? "#fecaca" : "#bbf7d0"),
        whiteSpace: "nowrap" as const
      }
    },
    React.createElement(Shield, { size: size === "sm" ? 9 : 11 }),
    label
  );
}
