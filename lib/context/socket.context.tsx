"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/lib/store/auth.store";
import Cookies from "js-cookie";

type ReactionUpdatePayload  = { postId: string; reactions: Array<{ emoji: string; count: number; hasReacted: boolean }> };
type CommentCountPayload    = { postId: string; commentCount: number };

type SocketContextType = {
  socket:      Socket | null;
  isConnected: boolean;
  /* FIX #17 #18 — Subscription helpers for post-level real-time updates */
  onPostReactionUpdate: (handler: (payload: ReactionUpdatePayload) => void) => () => void;
  onPostCommentUpdate:  (handler: (payload: CommentCountPayload)   => void) => () => void;
};

var SocketContext = createContext<SocketContextType>({
  socket:      null,
  isConnected: false,
  onPostReactionUpdate: function() { return function() {}; },
  onPostCommentUpdate:  function() { return function() {}; }
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  var [socket, setSocket]           = useState<Socket | null>(null);
  var [isConnected, setIsConnected] = useState(false);
  var { isAuthenticated } = useAuthStore();

  var reactionHandlers = useRef<Array<(p: ReactionUpdatePayload) => void>>([]);
  var commentHandlers  = useRef<Array<(p: CommentCountPayload)   => void>>([]);

  useEffect(function() {
    if (!isAuthenticated) {
      setSocket(function(prev) { if (prev) prev.disconnect(); return null; });
      setIsConnected(false);
      return;
    }

    var token = Cookies.get("cc_access");
    if (!token) return;

    var SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://15.207.144.166";

    var instance = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 20000
    });

    instance.on("connect",       function() { setIsConnected(true);  });
    instance.on("disconnect",    function() { setIsConnected(false); });
    instance.on("connect_error", function() { setIsConnected(false); });

    /* FIX #17 */
    instance.on("post:reactions:updated", function(payload: ReactionUpdatePayload) {
      reactionHandlers.current.forEach(function(h) { h(payload); });
    });

    /* FIX #18 */
    instance.on("post:comment:added", function(payload: CommentCountPayload) {
      commentHandlers.current.forEach(function(h) { h(payload); });
    });

    setSocket(instance);
    return function() { instance.disconnect(); setSocket(null); setIsConnected(false); };
  }, [isAuthenticated]);

  var onPostReactionUpdate = useCallback(function(handler: (p: ReactionUpdatePayload) => void) {
    reactionHandlers.current.push(handler);
    return function() {
      reactionHandlers.current = reactionHandlers.current.filter(function(h) { return h !== handler; });
    };
  }, []);

  var onPostCommentUpdate = useCallback(function(handler: (p: CommentCountPayload) => void) {
    commentHandlers.current.push(handler);
    return function() {
      commentHandlers.current = commentHandlers.current.filter(function(h) { return h !== handler; });
    };
  }, []);

  return React.createElement(
    SocketContext.Provider,
    { value: { socket, isConnected, onPostReactionUpdate, onPostCommentUpdate } },
    children
  );
}

export function useSocket() { return useContext(SocketContext); }
export type { ReactionUpdatePayload, CommentCountPayload };
