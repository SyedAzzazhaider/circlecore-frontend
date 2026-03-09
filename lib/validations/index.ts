import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "At least 2 characters").max(50, "Max 50 characters"),
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
      .regex(/[0-9]/, "Needs one number"),
    confirmPassword: z.string()
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const twoFactorSchema = z.object({
  code: z.string().length(6, "Must be 6 digits").regex(/^\d{6}$/, "Digits only")
});
export type TwoFactorFormData = z.infer<typeof twoFactorSchema>;
