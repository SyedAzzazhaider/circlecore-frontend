"use client";

import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import { notificationsApi } from "@/lib/api/notifications.api";
import { useSocket } from "@/lib/context/socket.context";
import { useAuthStore } from "@/lib/store/auth.store";

export function NotificationBell({ active }: { active: boolean }) {
  var { socket }          = useSocket();
  var { isAuthenticated } = useAuthStore();
  var pathname            = usePathname();
  var [unread, setUnread] = useState(0);

  useEffect(function() {
    if (!isAuthenticated) return;
    notificationsApi.getUnreadCount()
      .then(function(res) {
        var count = (res.data as any)?.data?.count;
        setUnread(typeof count === "number" ? count : 0);
      })
      .catch(function() {});
  }, [isAuthenticated]);

  useEffect(function() {
    if (pathname === "/notifications") { setUnread(0); }
  }, [pathname]);

  useEffect(function() {
    if (!socket) return;
    function onNew() { setUnread(function(n) { return n + 1; }); }
    socket.on("notification:new", onNew);
    return function() { socket.off("notification:new", onNew); };
  }, [socket]);

  return (
    <div className="relative inline-flex items-center">
      <Bell
        size={16}
        className={active
          ? "text-brand-600"
          : "text-surface-400 group-hover:text-surface-600 transition-colors"}
      />
      {unread > 0 && (
        <span
          className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center leading-none"
          style={{ boxShadow: "0 0 0 2px white" }}>
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </div>
  );
}
