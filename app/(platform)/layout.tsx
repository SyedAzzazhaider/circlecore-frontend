"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Calendar,
  Bell, CreditCard, Settings,
  Search, Menu, X, LogOut
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";
import { getInitials, getAvatarColor } from "@/lib/utils";
import { SocketProvider } from "@/lib/context/socket.context";
import { useSessionTimeout } from "@/lib/hooks/useSessionTimeout";

var NAV_ITEMS = [
  { href: "/feed",          icon: LayoutDashboard, label: "Feed"          },
  { href: "/communities",   icon: Users,           label: "Communities"   },
  { href: "/events",        icon: Calendar,        label: "Events"        },
  { href: "/notifications", icon: Bell,            label: "Notifications" },
  { href: "/billing",       icon: CreditCard,      label: "Billing"       },
  { href: "/settings",      icon: Settings,        label: "Settings"      }
];

function PlatformInner({ children }: { children: React.ReactNode }) {
  var pathname = usePathname();
  var router   = useRouter();
  var { user, clearAuth } = useAuthStore();
  var [mobileOpen, setMobileOpen] = useState(false);

  useSessionTimeout();

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  var initials = user ? getInitials(user.name) : "?";
  var avatarBg = user ? getAvatarColor(user.name) : "bg-brand-500";

  return React.createElement(
    "div",
    { className: "min-h-screen bg-surface-50 flex" },

    /* ── Sidebar desktop ── */
    React.createElement(
      "aside",
      { className: "hidden lg:flex w-60 flex-col fixed inset-y-0 left-0 z-30 bg-white border-r border-surface-200" },
      /* Logo */
      React.createElement(
        "div",
        { className: "flex items-center gap-2.5 px-5 h-16 border-b border-surface-100 shrink-0" },
        React.createElement(
          Link,
          { href: "/feed", className: "flex items-center gap-2.5" },
          React.createElement(
            "div",
            { className: "w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center", style: { boxShadow: "0 0 12px rgba(99,102,241,0.3)" } },
            React.createElement("svg", { width: "13", height: "13", viewBox: "0 0 14 14", fill: "none" },
              React.createElement("path", { d: "M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z", fill: "white" })
            )
          ),
          React.createElement("span", { className: "font-bold text-surface-900 text-[15px] tracking-tight" }, "CircleCore")
        )
      ),
      /* Search */
      React.createElement(
        "div",
        { className: "px-3 py-3 border-b border-surface-100" },
        React.createElement(
          Link,
          { href: "/search", className: "flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-50 border border-surface-200 text-sm text-surface-400 hover:border-brand-300 transition-colors" },
          React.createElement(Search, { size: 13 }),
          "Search..."
        )
      ),
      /* Nav */
      React.createElement(
        "nav",
        { className: "flex-1 px-3 py-3 space-y-0.5 overflow-y-auto" },
        NAV_ITEMS.map(function(item) {
          var active = pathname === item.href || pathname.startsWith(item.href + "/");
          return React.createElement(
            Link,
            {
              key: item.href,
              href: item.href,
              className: ["flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                active ? "bg-brand-50 text-brand-700 font-semibold" : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
              ].join(" ")
            },
            React.createElement(item.icon, { size: 16, className: active ? "text-brand-600" : "text-surface-400" }),
            item.label
          );
        })
      ),
      /* User bottom */
      React.createElement(
        "div",
        { className: "px-3 py-3 border-t border-surface-100 space-y-0.5" },
        user && React.createElement(
          Link,
          { href: "/profile/" + user._id, className: "flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-100 transition-colors" },
          React.createElement("div", { className: "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 " + avatarBg }, initials),
          React.createElement("div", { className: "min-w-0" },
            React.createElement("p", { className: "text-xs font-semibold text-surface-900 truncate" }, user.name),
            React.createElement("p", { className: "text-xs text-surface-400 truncate capitalize" }, user.role)
          )
        ),
        React.createElement(
          "button",
          { onClick: handleLogout, className: "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-surface-500 hover:bg-danger-50 hover:text-danger-600 transition-colors" },
          React.createElement(LogOut, { size: 15 }),
          "Sign out"
        )
      )
    ),

    /* ── Mobile header ── */
    React.createElement(
      "header",
      { className: "lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-surface-200 flex items-center justify-between px-4" },
      React.createElement("div", { className: "flex items-center gap-2" },
        React.createElement("div", { className: "w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center" },
          React.createElement("svg", { width: "13", height: "13", viewBox: "0 0 14 14", fill: "none" },
            React.createElement("path", { d: "M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z", fill: "white" })
          )
        ),
        React.createElement("span", { className: "font-bold text-surface-900 text-[15px]" }, "CircleCore")
      ),
      React.createElement(
        "button",
        { onClick: function() { setMobileOpen(function(v) { return !v; }); }, className: "w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-100 transition-colors" },
        mobileOpen ? React.createElement(X, { size: 18 }) : React.createElement(Menu, { size: 18 })
      )
    ),

    /* ── Mobile drawer ── */
    mobileOpen && React.createElement(
      "div",
      { className: "lg:hidden fixed inset-0 z-30", onClick: function() { setMobileOpen(false); } },
      React.createElement("div", { className: "absolute inset-0 bg-surface-900/50" }),
      React.createElement(
        "div",
        { className: "absolute left-0 top-14 bottom-0 w-64 bg-white border-r border-surface-200 overflow-y-auto", onClick: function(e: React.MouseEvent) { e.stopPropagation(); } },
        React.createElement("nav", { className: "px-3 py-3 space-y-0.5" },
          NAV_ITEMS.map(function(item) {
            var active = pathname === item.href;
            return React.createElement(
              Link,
              { key: item.href, href: item.href, onClick: function() { setMobileOpen(false); }, className: ["flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors", active ? "bg-brand-50 text-brand-700 font-semibold" : "text-surface-600 hover:bg-surface-100"].join(" ") },
              React.createElement(item.icon, { size: 16, className: active ? "text-brand-600" : "text-surface-400" }),
              item.label
            );
          })
        )
      )
    ),

    /* ── Main ── */
    React.createElement("main", { className: "flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-screen" }, children)
  );
}

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return React.createElement(
    SocketProvider,
    null,
    React.createElement(PlatformInner, null, children)
  );
}
