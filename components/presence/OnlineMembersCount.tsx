"use client";

import React, { useEffect, useState } from "react";
import { Circle } from "lucide-react";
import { useSocket } from "@/lib/context/socket.context";

type OnlineMembersCountProps = {
  communityId: string;
  className?:  string;
};

export function OnlineMembersCount({ communityId, className }: OnlineMembersCountProps) {
  var { socket, isConnected } = useSocket();
  var [count, setCount]       = useState(0);

  useEffect(function() {
    if (!socket || !communityId) return;
    socket.emit("community:join", communityId);
    function onPresence(data: { communityId: string; onlineCount: number }) {
      if (data.communityId === communityId) setCount(data.onlineCount);
    }
    socket.on("community:presence", onPresence);
    return function() {
      socket.emit("community:leave", communityId);
      socket.off("community:presence", onPresence);
    };
  }, [socket, communityId]);

  if (!isConnected || count === 0) return null;

  return (
    <span className={[
      "inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600",
      className || ""
    ].join(" ")}>
      <Circle size={6} className="fill-emerald-400 text-emerald-400" />
      {count} online
    </span>
  );
}
