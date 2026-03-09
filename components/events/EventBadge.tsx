"use client";

import React from "react";
import { Video, MapPin, Lock, Radio } from "lucide-react";
import type { EventType, EventStatus } from "@/lib/api/events.api";

type EventBadgeProps = {
  type?:   EventType;
  status?: EventStatus;
  size?:   "sm" | "md";
};

var TYPE_CONFIG = {
  webinar: { label: "Webinar", Icon: Video,  bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  meetup:  { label: "Meetup",  Icon: MapPin, bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  room:    { label: "Room",    Icon: Lock,   bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff" }
};

var STATUS_CONFIG = {
  upcoming: { label: "Upcoming",  bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
  live:     { label: "Live Now",  bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
  past:     { label: "Past",      bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" }
};

var BASE_STYLE: React.CSSProperties = {
  display:      "inline-flex",
  alignItems:   "center",
  borderRadius: "9999px",
  fontWeight:   700,
  whiteSpace:   "nowrap"
};

export function EventBadge({ type, status, size = "md" }: EventBadgeProps) {
  var pad      = size === "sm" ? "2px 7px"  : "3px 9px";
  var fontSize = size === "sm" ? "0.65rem"  : "0.7rem";
  var iconSize = size === "sm" ? 10 : 11;
  var gap      = size === "sm" ? "3px" : "4px";

  return React.createElement(
    "span",
    { style: { display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" as const } },

    type && (function() {
      var cfg = TYPE_CONFIG[type];
      return React.createElement(
        "span",
        { key: "type", style: { ...BASE_STYLE, gap, padding: pad, fontSize, backgroundColor: cfg.bg, color: cfg.color, border: "1px solid " + cfg.border } },
        React.createElement(cfg.Icon, { size: iconSize }),
        cfg.label
      );
    })(),

    status && (function() {
      var cfg = STATUS_CONFIG[status];
      return React.createElement(
        "span",
        { key: "status", style: { ...BASE_STYLE, gap, padding: pad, fontSize, backgroundColor: cfg.bg, color: cfg.color, border: "1px solid " + cfg.border } },
        status === "live" && React.createElement(Radio, { size: iconSize }),
        cfg.label
      );
    })()
  );
}
