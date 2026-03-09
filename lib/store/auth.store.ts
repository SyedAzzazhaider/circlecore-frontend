"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import type { CCUser } from "@/lib/types";

type AuthState = {
  user: CCUser | null;
  isAuthenticated: boolean;
  setAuth: (user: CCUser, accessToken: string, refreshToken: string) => void;
  updateUser: (updates: Partial<CCUser>) => void;
  clearAuth: () => void;
};

var isProduction = process.env.NODE_ENV === "production";

export var useAuthStore = create<AuthState>()(
  persist(
    function(set, get) {
      return {
        user: null,
        isAuthenticated: false,

        setAuth: function(user, accessToken, refreshToken) {
          Cookies.set("cc_access", accessToken, { expires: 7, sameSite: "strict", secure: isProduction });
          Cookies.set("cc_refresh", refreshToken, { expires: 30, sameSite: "strict", secure: isProduction });
          set({ user: user, isAuthenticated: true });
        },

        updateUser: function(updates) {
          var current = get().user;
          if (current) {
            set({ user: Object.assign({}, current, updates) });
          }
        },

        clearAuth: function() {
          Cookies.remove("cc_access");
          Cookies.remove("cc_refresh");
          set({ user: null, isAuthenticated: false });
        }
      };
    },
    {
      name: "cc-auth-v1",
      partialize: function(state) {
        return { user: state.user, isAuthenticated: state.isAuthenticated };
      }
    }
  )
);
