export interface CCUser {
  _id: string;
  name: string;
  email: string;
  role: "member" | "moderator" | "admin" | "super_admin";
  profileId: string;
  isEmailVerified: boolean;
  isSuspended: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: CCUser;
  accessToken: string;
  refreshToken: string;
  requiresTwoFactor?: boolean;
  twoFactorTempToken?: string;
}

/* PRD-defined membership tiers: standard / premium / mod */
export type MembershipTier = "standard" | "premium" | "mod";

export type ReputationLevel = "newcomer" | "contributor" | "trusted" | "expert" | "legend";
