import {
  toCalendarDate,
  generateGoogleCalendarUrl,
  generateICalContent
} from "@/lib/utils/calendar";

var EVENT = {
  _id:       "abc123",
  title:     "Founder Summit",
  details:   "Annual summit for community founders.",
  startDate: "2026-04-01T10:00:00.000Z",
  endDate:   "2026-04-01T12:00:00.000Z"
};

describe("toCalendarDate()", () => {
  it("produces compact UTC format",          () => expect(toCalendarDate("2026-04-01T10:00:00.000Z")).toBe("20260401T100000Z"));
  it("ends with Z",                          () => expect(toCalendarDate("2026-12-25T00:00:00.000Z").endsWith("Z")).toBe(true));
  it("contains no dashes",                   () => expect(toCalendarDate("2026-04-01T10:00:00.000Z").includes("-")).toBe(false));
  it("contains no colons",                   () => expect(toCalendarDate("2026-04-01T10:30:00.000Z").includes(":")).toBe(false));
  it("length is exactly 16",                 () => expect(toCalendarDate("2026-04-01T10:00:00.000Z").length).toBe(16));
});

describe("generateGoogleCalendarUrl()", () => {
  var url = generateGoogleCalendarUrl(EVENT);

  it("starts with Google Calendar base URL", () => expect(url.startsWith("https://calendar.google.com/calendar/render")).toBe(true));
  it("contains action=TEMPLATE",             () => expect(url).toContain("action=TEMPLATE"));
  it("contains event title encoded",         () => expect(url).toContain("Founder"));
  it("contains dates param",                 () => expect(url).toContain("dates="));
  it("includes details param",               () => expect(url).toContain("details="));
});

describe("generateGoogleCalendarUrl() with location", () => {
  var url = generateGoogleCalendarUrl({ ...EVENT, location: "New York, NY" });
  it("includes location param",              () => expect(url).toContain("location="));
  it("location value is present in URL",     () => expect(decodeURIComponent(url.replace(/\+/g, " "))).toContain("New York, NY"));
});

describe("generateICalContent()", () => {
  var content = generateICalContent(EVENT);

  it("starts with BEGIN:VCALENDAR",          () => expect(content.startsWith("BEGIN:VCALENDAR")).toBe(true));
  it("ends with END:VCALENDAR",              () => expect(content.endsWith("END:VCALENDAR")).toBe(true));
  it("contains VERSION:2.0",                () => expect(content).toContain("VERSION:2.0"));
  it("contains DTSTART",                    () => expect(content).toContain("DTSTART:20260401T100000Z"));
  it("contains DTEND",                      () => expect(content).toContain("DTEND:20260401T120000Z"));
  it("contains event title in SUMMARY",     () => expect(content).toContain("SUMMARY:Founder Summit"));
  it("contains UID with event ID",          () => expect(content).toContain("UID:abc123@circlecore"));
  it("contains PRODID for CircleCore",      () => expect(content).toContain("PRODID:-//CircleCore"));
  it("contains CALSCALE:GREGORIAN",         () => expect(content).toContain("CALSCALE:GREGORIAN"));
  it("contains description text",           () => expect(content).toContain("DESCRIPTION:Annual summit"));
});
