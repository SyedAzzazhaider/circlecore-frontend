"use client";

import React from "react";
import { useSocket } from "@/lib/context/socket.context";

type PresenceIndicatorProps = {
  showLabel?: boolean;
  size?:      "sm" | "md";
};

export function PresenceIndicator({ showLabel = true, size = "sm" }: PresenceIndicatorProps) {
  var { isConnected } = useSocket();

  var dotClass = [
    size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5",
    "rounded-full shrink-0 transition-all duration-300",
    isConnected
      ? "bg-emerald-400"
      : "bg-surface-300"
  ].join(" ");

  return React.createElement(
    "div",
    { className: "inline-flex items-center gap-1.5" },
    React.createElement("div", {
      className: dotClass,
      style: isConnected ? { boxShadow: "0 0 0 3px rgba(52,211,153,0.2)" } : undefined
    }),
    showLabel && React.createElement(
      "span",
      { className: "text-xs font-medium " + (isConnected ? "text-emerald-600" : "text-surface-400") },
      isConnected ? "Online" : "Offline"
    )
  );
}
