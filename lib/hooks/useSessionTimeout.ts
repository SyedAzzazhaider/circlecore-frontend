"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";
import toast from "react-hot-toast";

var TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
var WARNING_MS = 2 * 60 * 1000;  // warn 2 minutes before

var ACTIVITY_EVENTS = [
  "mousedown", "mousemove", "keydown",
  "scroll", "touchstart", "click", "wheel"
];

export function useSessionTimeout() {
  var router              = useRouter();
  var { isAuthenticated, clearAuth } = useAuthStore();
  var timeoutRef          = useRef<ReturnType<typeof setTimeout> | null>(null);
  var warningRef          = useRef<ReturnType<typeof setTimeout> | null>(null);
  var warningToastRef     = useRef<string | null>(null);

  var clearTimers = useCallback(function() {
    if (timeoutRef.current)  clearTimeout(timeoutRef.current);
    if (warningRef.current)  clearTimeout(warningRef.current);
    if (warningToastRef.current) toast.dismiss(warningToastRef.current);
  }, []);

  var resetTimer = useCallback(function() {
    if (!isAuthenticated) return;
    clearTimers();

    warningRef.current = setTimeout(function() {
      warningToastRef.current = toast(
        "You will be signed out in 2 minutes due to inactivity.",
        { duration: 120000, icon: "⚠️" }
      );
    }, TIMEOUT_MS - WARNING_MS);

    timeoutRef.current = setTimeout(function() {
      clearAuth();
      router.push("/login?reason=timeout");
      toast.error("Session expired. Please sign in again.");
    }, TIMEOUT_MS);
  }, [isAuthenticated, clearAuth, router, clearTimers]);

  useEffect(function() {
    if (!isAuthenticated) { clearTimers(); return; }

    resetTimer();

    ACTIVITY_EVENTS.forEach(function(event) {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    return function() {
      clearTimers();
      ACTIVITY_EVENTS.forEach(function(event) {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, resetTimer, clearTimers]);
}
