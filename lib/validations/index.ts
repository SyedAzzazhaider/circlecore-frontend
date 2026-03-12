import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "At least 2 characters").max(50, "Max 50 characters").trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Needs one uppercase letter")
    .regex(/[0-9]/, "Needs one number"),
  inviteCode: z.string().min(4, "Invalid invite code").max(32).trim().toUpperCase()
});
export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required")
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim()
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Needs one uppercase letter")
      .regex(/[0-9]/, "Needs one number")
      .regex(/[^A-Za-z0-9]/, "Needs one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password")
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Needs one uppercase letter")
      .regex(/[0-9]/, "Needs one number")
      .regex(/[^A-Za-z0-9]/, "Needs one special character"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password")
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"]
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must differ from current password",
    path: ["newPassword"]
  });
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const twoFactorSchema = z.object({
  code: z.string().length(6, "Must be 6 digits").regex(/^\d{6}$/, "Digits only")
});
export type TwoFactorFormData = z.infer<typeof twoFactorSchema>;
