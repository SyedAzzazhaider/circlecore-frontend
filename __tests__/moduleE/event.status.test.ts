import {
  isEventPast,
  isEventLive,
  isEventUpcoming,
  isEventFull,
  getCapacityPercent,
  getCapacityBarColor,
  getSpotsRemaining,
  formatAttendeeCount
} from "@/lib/utils/events";

describe("isEventPast()", () => {
  it("returns true for past",             () => expect(isEventPast("past")).toBe(true));
  it("returns false for live",            () => expect(isEventPast("live")).toBe(false));
  it("returns false for upcoming",        () => expect(isEventPast("upcoming")).toBe(false));
});

describe("isEventLive()", () => {
  it("returns true for live",             () => expect(isEventLive("live")).toBe(true));
  it("returns false for past",            () => expect(isEventLive("past")).toBe(false));
  it("returns false for upcoming",        () => expect(isEventLive("upcoming")).toBe(false));
});

describe("isEventUpcoming()", () => {
  it("returns true for upcoming",         () => expect(isEventUpcoming("upcoming")).toBe(true));
  it("returns false for live",            () => expect(isEventUpcoming("live")).toBe(false));
  it("returns false for past",            () => expect(isEventUpcoming("past")).toBe(false));
});

describe("isEventFull()", () => {
  it("returns false — no maxAttendees",   () => expect(isEventFull(100)).toBe(false));
  it("returns false — maxAttendees 0",    () => expect(isEventFull(5, 0)).toBe(false));
  it("returns false — room available",    () => expect(isEventFull(50, 100)).toBe(false));
  it("returns false — one spot left",     () => expect(isEventFull(99, 100)).toBe(false));
  it("returns true  — exactly at cap",    () => expect(isEventFull(100, 100)).toBe(true));
  it("returns true  — over capacity",     () => expect(isEventFull(101, 100)).toBe(true));
});

describe("getCapacityPercent()", () => {
  it("returns 0 for empty event",         () => expect(getCapacityPercent(0, 100)).toBe(0));
  it("returns 50 for half full",          () => expect(getCapacityPercent(50, 100)).toBe(50));
  it("returns 100 for full event",        () => expect(getCapacityPercent(100, 100)).toBe(100));
  it("caps at 100 when over capacity",    () => expect(getCapacityPercent(150, 100)).toBe(100));
  it("rounds to nearest integer",         () => expect(getCapacityPercent(1, 3)).toBe(33));
  it("handles maxAttendees of 0",         () => expect(getCapacityPercent(5, 0)).toBe(0));
});

describe("getCapacityBarColor()", () => {
  it("brand for low occupancy (40%)",     () => expect(getCapacityBarColor(40)).toBe("bg-brand-500"));
  it("brand for just below 70% (69%)",    () => expect(getCapacityBarColor(69)).toBe("bg-brand-500"));
  it("amber at exactly 70%",             () => expect(getCapacityBarColor(70)).toBe("bg-amber-500"));
  it("amber for 80%",                    () => expect(getCapacityBarColor(80)).toBe("bg-amber-500"));
  it("amber just below 90% (89%)",       () => expect(getCapacityBarColor(89)).toBe("bg-amber-500"));
  it("danger at exactly 90%",            () => expect(getCapacityBarColor(90)).toBe("bg-danger-500"));
  it("danger at 100%",                   () => expect(getCapacityBarColor(100)).toBe("bg-danger-500"));
});

describe("getSpotsRemaining()", () => {
  it("returns null — no maxAttendees",    () => expect(getSpotsRemaining(50)).toBeNull());
  it("returns correct spots remaining",  () => expect(getSpotsRemaining(30, 100)).toBe(70));
  it("returns 0 when exactly full",      () => expect(getSpotsRemaining(100, 100)).toBe(0));
  it("returns 0 when over capacity",     () => expect(getSpotsRemaining(110, 100)).toBe(0));
  it("returns max when no attendees",    () => expect(getSpotsRemaining(0, 50)).toBe(50));
});

describe("formatAttendeeCount()", () => {
  it("no cap — just count",              () => expect(formatAttendeeCount(42)).toBe("42 attending"));
  it("with cap — shows ratio",           () => expect(formatAttendeeCount(50, 100)).toBe("50 / 100 attending"));
  it("zero attendees",                   () => expect(formatAttendeeCount(0)).toBe("0 attending"));
  it("full event shows exact cap",       () => expect(formatAttendeeCount(100, 100)).toBe("100 / 100 attending"));
  it("zero attendees with cap",          () => expect(formatAttendeeCount(0, 200)).toBe("0 / 200 attending"));
});