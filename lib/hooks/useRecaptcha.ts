"use client";

import { useEffect, useCallback } from "react";

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

var SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

export function useRecaptcha() {
  useEffect(function() {
    if (!SITE_KEY) return;
    if (document.getElementById("recaptcha-script")) return;

    var script = document.createElement("script");
    script.id  = "recaptcha-script";
    script.src = "https://www.google.com/recaptcha/api.js?render=" + SITE_KEY;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  var getToken = useCallback(async function(action: string): Promise<string> {
    if (!SITE_KEY) return "";
    return new Promise(function(resolve) {
      window.grecaptcha.ready(async function() {
        try {
          var token = await window.grecaptcha.execute(SITE_KEY, { action: action });
          resolve(token);
        } catch(e) {
          resolve("");
        }
      });
    });
  }, []);

  return { getToken };
}
