"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Calendar,
  Bell, CreditCard, Settings,
  Search, Menu, X, LogOut, ChevronRight
} from "lucide-react";
import { useAuthStore }        from "@/lib/store/auth.store";
import { getInitials, getAvatarColor } from "@/lib/utils";
import { SocketProvider }      from "@/lib/context/socket.context";
import { useSessionTimeout }   from "@/lib/hooks/useSessionTimeout";
import { NotificationBell }    from "@/components/notifications/NotificationBell";

var NAV_ITEMS = [
  { href: "/feed",          icon: LayoutDashboard, label: "Feed"          },
  { href: "/communities",   icon: Users,           label: "Communities"   },
  { href: "/events",        icon: Calendar,        label: "Events"        },
  { href: "/notifications", icon: Bell,            label: "Notifications", hasLiveBadge: true },
  { href: "/billing",       icon: CreditCard,      label: "Billing"       },
  { href: "/settings",      icon: Settings,        label: "Settings"      }
];

function PlatformInner({ children }: { children: React.ReactNode }) {
  var pathname = usePathname();
  var router   = useRouter();
  var { user, clearAuth } = useAuthStore();
  var [mobileOpen, setMobileOpen] = useState(false);

  useSessionTimeout();

  function handleLogout() { clearAuth(); router.push("/login"); }

  var initials = user ? getInitials(user.name) : "?";
  var avatarBg = user ? getAvatarColor(user.name) : "bg-brand-500";

  var SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-surface-100 shrink-0">
        <Link href="/feed" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center group-hover:scale-105 transition-transform"
            style={{ boxShadow: "0 0 14px rgba(99,102,241,0.35)" }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="white" />
            </svg>
          </div>
          <span className="font-black text-surface-900 text-[15px] tracking-tight">CircleCore</span>
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-surface-100">
        <Link href="/search"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-400 hover:border-brand-300 hover:bg-brand-50/50 transition-all group">
          <Search size={12} className="group-hover:text-brand-500 transition-colors" />
          <span className="group-hover:text-surface-600 transition-colors">Search anything...</span>
          <span className="ml-auto text-[10px] font-semibold text-surface-300 bg-surface-100 px-1.5 py-0.5 rounded-md">&#8984;K</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(function(item) {
          var active = pathname === item.href || (item.href !== "/feed" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={[
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                active
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
              ].join(" ")}>
              {item.hasLiveBadge
                ? <NotificationBell active={active} />
                : <item.icon size={16} className={active ? "text-brand-600" : "text-surface-400 group-hover:text-surface-600 transition-colors"} />
              }
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={12} className="text-brand-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-3 border-t border-surface-100 space-y-0.5">
        {user && (
          <Link href={"/profile/" + user._id}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-surface-100 transition-all duration-150 group">
            <div className={"w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 " + avatarBg}
              style={{ boxShadow: "0 0 0 2px white, 0 0 0 3px rgba(99,102,241,0.2)" }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-surface-900 truncate">{user.name}</p>
              <p className="text-[10px] text-surface-400 truncate capitalize font-medium">{user.role}</p>
            </div>
            <ChevronRight size={12} className="text-surface-300 group-hover:text-surface-500 transition-colors" />
          </Link>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-surface-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 font-medium">
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface-50 flex">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col fixed inset-y-0 left-0 z-30 bg-white border-r border-surface-200">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-b border-surface-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center"
            style={{ boxShadow: "0 0 12px rgba(99,102,241,0.3)" }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="white" />
            </svg>
          </div>
          <span className="font-black text-surface-900 text-[15px] tracking-tight">CircleCore</span>
        </div>
        <button onClick={function() { setMobileOpen(function(v) { return !v; }); }}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-100 transition-colors">
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30" onClick={function() { setMobileOpen(false); }}>
          <div className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm" />
          <div className="absolute left-0 top-14 bottom-0 w-64 bg-white border-r border-surface-200 flex flex-col overflow-y-auto"
            onClick={function(e: React.MouseEvent) { e.stopPropagation(); }}>
            <nav className="px-3 py-3 space-y-0.5 flex-1">
              {NAV_ITEMS.map(function(item) {
                var active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    onClick={function() { setMobileOpen(false); }}
                    className={["flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      active ? "bg-brand-50 text-brand-700 font-semibold" : "text-surface-600 hover:bg-surface-100"
                    ].join(" ")}>
                    {item.hasLiveBadge
                      ? <NotificationBell active={active} />
                      : <item.icon size={16} className={active ? "text-brand-600" : "text-surface-400"} />
                    }
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            {user && (
              <div className="px-3 py-3 border-t border-surface-100">
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <div className={"w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold " + avatarBg}>{initials}</div>
                  <div>
                    <p className="text-xs font-bold text-surface-900">{user.name}</p>
                    <p className="text-[10px] text-surface-400 capitalize">{user.role}</p>
                  </div>
                </div>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors font-medium mt-1">
                  <LogOut size={14} />Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <PlatformInner>{children}</PlatformInner>
    </SocketProvider>
  );
}
