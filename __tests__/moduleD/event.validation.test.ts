import { createEventSchema } from "@/lib/validations/event";

var V = {
  title:     "Founder AMA Session",
  details:   "Join us for a live Q&A with top founders from the community.",
  type:      "webinar" as const,
  startDate: "2026-04-01T10:00:00Z",
  endDate:   "2026-04-01T12:00:00Z"
};

describe("createEventSchema — type validation", () => {
  it("passes — webinar type",          () => expect(createEventSchema.safeParse(V).success).toBe(true));
  it("passes — meetup type",           () => expect(createEventSchema.safeParse({ ...V, type: "meetup" as const }).success).toBe(true));
  it("passes — room type",             () => expect(createEventSchema.safeParse({ ...V, type: "room"   as const }).success).toBe(true));
  it("fails  — invalid type",          () => expect(createEventSchema.safeParse({ ...V, type: "party"  as any   }).success).toBe(false));
});

describe("createEventSchema — title validation", () => {
  it("fails  — title too short (1 char)",  () => expect(createEventSchema.safeParse({ ...V, title: "A" }).success).toBe(false));
  it("passes — title exactly 3 chars",     () => expect(createEventSchema.safeParse({ ...V, title: "ABC" }).success).toBe(true));
  it("fails  — title over 200 chars",      () => expect(createEventSchema.safeParse({ ...V, title: "A".repeat(201) }).success).toBe(false));
  it("passes — title exactly 200 chars",   () => expect(createEventSchema.safeParse({ ...V, title: "A".repeat(200) }).success).toBe(true));
});

describe("createEventSchema — details validation", () => {
  it("fails  — details too short (9 chars)",  () => expect(createEventSchema.safeParse({ ...V, details: "Too short" }).success).toBe(false));
  it("passes — details exactly 10 chars",     () => expect(createEventSchema.safeParse({ ...V, details: "A".repeat(10) }).success).toBe(true));
  it("fails  — details over 5000 chars",      () => expect(createEventSchema.safeParse({ ...V, details: "A".repeat(5001) }).success).toBe(false));
});

describe("createEventSchema — dates validation", () => {
  it("fails  — missing start date",      () => expect(createEventSchema.safeParse({ ...V, startDate: "" }).success).toBe(false));
  it("fails  — missing end date",        () => expect(createEventSchema.safeParse({ ...V, endDate:   "" }).success).toBe(false));
  it("fails  — end before start",        () => expect(createEventSchema.safeParse({ ...V, startDate: "2026-04-01T12:00:00Z", endDate: "2026-04-01T10:00:00Z" }).success).toBe(false));
  it("fails  — end equal to start",      () => expect(createEventSchema.safeParse({ ...V, startDate: "2026-04-01T10:00:00Z", endDate: "2026-04-01T10:00:00Z" }).success).toBe(false));
});

describe("createEventSchema — optional fields", () => {
  it("passes — valid meeting URL",       () => expect(createEventSchema.safeParse({ ...V, meetingUrl: "https://zoom.us/j/123456" }).success).toBe(true));
  it("fails  — invalid meeting URL",     () => expect(createEventSchema.safeParse({ ...V, meetingUrl: "not-a-url" }).success).toBe(false));
  it("passes — with location",           () => expect(createEventSchema.safeParse({ ...V, type: "meetup" as const, location: "New York, NY" }).success).toBe(true));
  it("fails  — too many tags (6)",       () => expect(createEventSchema.safeParse({ ...V, tags: ["a","b","c","d","e","f"] }).success).toBe(false));
  it("passes — exactly 5 tags",          () => expect(createEventSchema.safeParse({ ...V, tags: ["a","b","c","d","e"] }).success).toBe(true));
});
