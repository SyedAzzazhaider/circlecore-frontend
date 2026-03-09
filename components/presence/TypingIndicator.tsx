"use client";

import React from "react";

type TypingIndicatorProps = {
  names: string[];
};

export function TypingIndicator({ names }: TypingIndicatorProps) {
  if (names.length === 0) return null;

  var text =
    names.length === 1
      ? names[0] + " is typing..."
      : names.length === 2
        ? names[0] + " and " + names[1] + " are typing..."
        : "Several people are typing...";

  return React.createElement(
    "div",
    { className: "flex items-center gap-2 px-1 py-1 select-none" },
    React.createElement(
      "div",
      { className: "flex items-center gap-0.5" },
      [0, 1, 2].map(function(i) {
        return React.createElement("div", {
          key: i,
          className: "w-1.5 h-1.5 rounded-full bg-surface-400",
          style: {
            animation:      "bounce 1.2s infinite ease-in-out",
            animationDelay: (i * 0.2) + "s"
          }
        });
      })
    ),
    React.createElement(
      "span",
      { className: "text-xs text-surface-400 italic leading-none" },
      text
    )
  );
}
