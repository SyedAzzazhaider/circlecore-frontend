import api from "./client";
import type { CCUser, AuthResponse } from "@/lib/types";

export type { CCUser, AuthResponse };

var BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://15.207.144.166";

export var authApi = {
  register: function(payload: {
    name: string;
    email: string;
    password: string;
    inviteCode: string;
    recaptchaToken?: string;
  }) {
    return api.post<{ data: AuthResponse }>("/auth/register", payload);
  },

  login: function(payload: {
    email: string;
    password: string;
    recaptchaToken?: string;
  }) {
    return api.post<{ data: AuthResponse }>("/auth/login", payload);
  },

  logout: function(refreshToken: string) {
    return api.post("/auth/logout", { refreshToken: refreshToken });
  },

  refreshToken: function(refreshToken: string) {
    return api.post<{ data: { accessToken: string } }>("/auth/refresh", { refreshToken: refreshToken });
  },

  verifyEmail: function(token: string) {
    return api.get("/auth/verify-email?token=" + token);
  },

  forgotPassword: function(email: string) {
    return api.post("/auth/forgot-password", { email: email });
  },

  resetPassword: function(token: string, password: string) {
    return api.post("/auth/reset-password", { token: token, password: password });
  },

  verifyTwoFactor: function(payload: { twoFactorTempToken: string; code: string }) {
    return api.post<{ data: AuthResponse }>("/auth/2fa/verify", payload);
  },

  validateInviteCode: function(code: string) {
    return api.post<{ data: { valid: boolean; communityName?: string } }>(
      "/invites/validate",
      { code: code }
    );
  },

  /* OAuth — redirects to backend which handles provider handshake */
  getOAuthUrl: function(provider: "google" | "apple" | "linkedin"): string {
    return BASE_URL + "/api/auth/oauth/" + provider;
  },

  /* Called on OAuth callback page to exchange code for tokens */
  oauthCallback: function(provider: string, code: string, state: string) {
    return api.post<{ data: AuthResponse }>("/auth/oauth/" + provider + "/callback", {
      code: code,
      state: state
    });
  }
};
