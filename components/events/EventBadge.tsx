"use client";

import React from "react";
import { Video, MapPin, Lock, Radio, Globe } from "lucide-react";
import type { EventType, EventStatus } from "@/lib/api/events.api";

type EventBadgeProps = {
  type?:   EventType;
  status?: EventStatus;
  size?:   "sm" | "md";
};

var TYPE_CONFIG = {
  webinar: { label: "Webinar", Icon: Video,  bg: "rgba(219,234,254,0.8)", color: "#1d4ed8", border: "rgba(147,197,253,0.6)" },
  meetup:  { label: "Meetup",  Icon: MapPin, bg: "rgba(220,252,231,0.8)", color: "#15803d", border: "rgba(134,239,172,0.6)" },
  room:    { label: "Room",    Icon: Globe,  bg: "rgba(243,232,255,0.8)", color: "#7e22ce", border: "rgba(216,180,254,0.6)" }
};

var STATUS_CONFIG = {
  upcoming: { label: "Upcoming", bg: "rgba(224,242,254,0.8)", color: "#0369a1", border: "rgba(125,211,252,0.5)" },
  live:     { label: "Live Now", bg: "rgba(254,226,226,0.9)", color: "#b91c1c", border: "rgba(252,165,165,0.6)" },
  past:     { label: "Past",     bg: "rgba(241,245,249,0.8)", color: "#64748b", border: "rgba(203,213,225,0.6)" }
};

export function EventBadge({ type, status, size = "md" }: EventBadgeProps) {
  var pad      = size === "sm" ? "2px 8px"  : "3px 10px";
  var fontSize = size === "sm" ? "0.64rem"  : "0.68rem";
  var iconSize = size === "sm" ? 10 : 11;

  var base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "4px",
    borderRadius: "9999px", fontWeight: 700, whiteSpace: "nowrap",
    padding: pad, fontSize, backdropFilter: "blur(8px)",
    letterSpacing: "0.01em"
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", flexWrap: "wrap" as const }}>
      {type && (function() {
        var cfg = TYPE_CONFIG[type];
        if (!cfg) return null;
        return (
          <span key="type" style={{ ...base, background: cfg.bg, color: cfg.color, border: "1px solid " + cfg.border, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <cfg.Icon size={iconSize} />
            {cfg.label}
          </span>
        );
      })()}
      {status && (function() {
        var cfg = STATUS_CONFIG[status];
        if (!cfg) return null;
        return (
          <span key="status" style={{ ...base, background: cfg.bg, color: cfg.color, border: "1px solid " + cfg.border, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {status === "live" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s infinite", flexShrink: 0 }} />}
            {cfg.label}
          </span>
        );
      })()}
    </span>
  );
}
