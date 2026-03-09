"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/lib/store/auth.store";
import Cookies from "js-cookie";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

var SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  var [socket, setSocket]           = useState<Socket | null>(null);
  var [isConnected, setIsConnected] = useState(false);
  var { isAuthenticated } = useAuthStore();

  useEffect(function() {
    if (!isAuthenticated) {
      setSocket(function(prev) {
        if (prev) { prev.disconnect(); }
        return null;
      });
      setIsConnected(false);
      return;
    }

    var token = Cookies.get("cc_access");
    if (!token) return;

    var SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://15.207.144.166";

    var instance = io(SOCKET_URL, {
      auth:   { token: token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 20000
    });

    instance.on("connect",       function() { setIsConnected(true);  });
    instance.on("disconnect",    function() { setIsConnected(false); });
    instance.on("connect_error", function() { setIsConnected(false); });

    setSocket(instance);

    return function() {
      instance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated]);

  return React.createElement(
    SocketContext.Provider,
    { value: { socket: socket, isConnected: isConnected } },
    children
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
