"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { authApi } from "@/lib/api/auth.api";
import { useAuthStore } from "@/lib/store/auth.store";
import { getErrorMessage } from "@/lib/api/client";
import toast from "react-hot-toast";

export default function OAuthCallbackPage() {
  var params   = useSearchParams();
  var router   = useRouter();
  var { setAuth } = useAuthStore();
  var [error, setError] = useState("");

  useEffect(function() {
    var code     = params.get("code");
    var state    = params.get("state");
    var provider = params.get("provider") || "google";
    var err      = params.get("error");

    if (err) {
      setError("OAuth sign-in was cancelled or failed.");
      return;
    }

    if (!code) {
      setError("Invalid OAuth response. Please try again.");
      return;
    }

    authApi
      .oauthCallback(provider, code, state || "")
      .then(function(res) {
        var payload = res.data.data;
        setAuth(payload.user, payload.accessToken, payload.refreshToken);
        toast.success("Welcome, " + payload.user.name.split(" ")[0] + "!");
        router.push("/feed");
      })
      .catch(function(err) {
        setError(getErrorMessage(err));
      });
  }, [params, router, setAuth]);

  if (error) {
    return React.createElement(
      "div",
      { className: "auth-card text-center" },
      React.createElement(
        "div",
        { className: "w-12 h-12 rounded-2xl bg-danger-50 border border-danger-200 flex items-center justify-center mx-auto mb-4" },
        React.createElement(XCircle, { size: 24, className: "text-danger-500" })
      ),
      React.createElement("h1", { className: "text-lg font-bold text-surface-900 mb-1" }, "Sign-in failed"),
      React.createElement("p", { className: "text-sm text-surface-500 mb-6" }, error),
      React.createElement(
        "button",
        {
          onClick: function() { router.push("/login"); },
          className: "btn btn-secondary btn-md w-full"
        },
        "Back to sign in"
      )
    );
  }

  return React.createElement(
    "div",
    { className: "auth-card text-center" },
    React.createElement(Loader2, { size: 32, className: "animate-spin text-brand-500 mx-auto mb-4" }),
    React.createElement("p", { className: "text-sm font-semibold text-surface-900" }, "Completing sign-in..."),
    React.createElement("p", { className: "text-xs text-surface-400 mt-1" }, "Please wait a moment.")
  );
}
