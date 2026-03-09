import { z } from "zod";

export const onboardingStep1Schema = z.object({
  bio: z
    .string()
    .max(300, "Bio cannot exceed 300 characters")
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .max(100, "Location cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal(""))
});
export type OnboardingStep1Data = z.infer<typeof onboardingStep1Schema>;

export const onboardingStep2Schema = z.object({
  skills: z
    .array(z.string().min(1).max(40))
    .min(1, "Please add at least one skill")
    .max(15, "Maximum 15 skills allowed")
});
export type OnboardingStep2Data = z.infer<typeof onboardingStep2Schema>;

export const onboardingStep3Schema = z.object({
  interests: z
    .array(z.string().min(1).max(40))
    .min(1, "Please select at least one interest")
    .max(10, "Maximum 10 interests allowed")
});
export type OnboardingStep3Data = z.infer<typeof onboardingStep3Schema>;

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "At least 2 characters").max(50, "Max 50 characters"),
  bio: z
    .string()
    .max(300, "Bio cannot exceed 300 characters")
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .max(100, "Location cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  skills: z.array(z.string()).max(15).optional(),
  interests: z.array(z.string()).max(10).optional(),
  socialLinks: z
    .object({
      twitter:  z.string().url("Invalid URL").optional().or(z.literal("")),
      linkedin: z.string().url("Invalid URL").optional().or(z.literal("")),
      github:   z.string().url("Invalid URL").optional().or(z.literal(""))
    })
    .optional()
});
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
