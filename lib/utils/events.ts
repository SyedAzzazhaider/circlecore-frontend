/**
 * Module E — Events & Meetups
 * Pure utility functions: no side effects, fully unit-testable.
 * Used by EventCard, EventDetailPage, and tests.
 */

export type EventStatus = "upcoming" | "live" | "past";

export function isEventPast(status: EventStatus | string): boolean {
  return status === "past";
}

export function isEventLive(status: EventStatus | string): boolean {
  return status === "live";
}

export function isEventUpcoming(status: EventStatus | string): boolean {
  return status === "upcoming";
}

/** Returns true when rsvpCount has reached or exceeded maxAttendees. */
export function isEventFull(rsvpCount: number, maxAttendees?: number): boolean {
  if (!maxAttendees || maxAttendees <= 0) return false;
  return rsvpCount >= maxAttendees;
}

/**
 * Returns occupancy as an integer percentage, capped at 100.
 * Used to drive the capacity progress bar.
 */
export function getCapacityPercent(rsvpCount: number, maxAttendees: number): number {
  if (maxAttendees <= 0) return 0;
  return Math.min(100, Math.round((rsvpCount / maxAttendees) * 100));
}

/**
 * Returns the Tailwind colour class for the capacity bar:
 * - <70%  → brand blue  (plenty of room)
 * - 70-89% → amber      (filling up)
 * - ≥90%  → danger red  (nearly/fully full)
 */
export function getCapacityBarColor(pct: number): string {
  if (pct >= 90) return "bg-danger-500";
  if (pct >= 70) return "bg-amber-500";
  return "bg-brand-500";
}

/**
 * Returns how many spots are left, or null when the event has no cap.
 * Never returns a negative value.
 */
export function getSpotsRemaining(rsvpCount: number, maxAttendees?: number): number | null {
  if (!maxAttendees) return null;
  return Math.max(0, maxAttendees - rsvpCount);
}

/**
 * Human-readable attendee count string shown in cards and detail pages.
 * Examples: "42 attending", "50 / 100 attending"
 */
export function formatAttendeeCount(rsvpCount: number, maxAttendees?: number): string {
  if (maxAttendees) {
    return rsvpCount + " / " + maxAttendees + " attending";
  }
  return rsvpCount + " attending";
}