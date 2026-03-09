import { z } from "zod";

export var createEventSchema = z
  .object({
    title: z
      .string()
      .min(3,   "Title must be at least 3 characters")
      .max(200, "Title cannot exceed 200 characters"),
    details: z
      .string()
      .min(10,   "Details must be at least 10 characters")
      .max(5000, "Details cannot exceed 5,000 characters"),
    type: z.enum(["webinar", "meetup", "room"], {
      errorMap: function() { return { message: "Select a valid event type" }; }
    }),
    startDate: z.string().min(1, "Start date is required"),
    endDate:   z.string().min(1, "End date is required"),
    location: z
      .string()
      .max(300, "Location too long")
      .optional()
      .or(z.literal("")),
    meetingUrl: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .or(z.literal("")),
    maxAttendees: z
      .number()
      .int()
      .min(1, "Minimum 1 attendee")
      .max(100000, "Maximum 100,000 attendees")
      .optional(),
    isPrivate: z.boolean().optional(),
    tags: z
      .array(z.string().max(30))
      .max(5, "Maximum 5 tags")
      .optional()
  })
  .refine(
    function(data) {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.endDate) > new Date(data.startDate);
    },
    { message: "End date must be after start date", path: ["endDate"] }
  );

export type CreateEventFormData = z.infer<typeof createEventSchema>;
