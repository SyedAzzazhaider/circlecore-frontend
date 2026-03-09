/**
 * Calendar sync utilities — Google Calendar + iCal (.ics)
 * PRD Module E requirement: Calendar sync
 */

export function toCalendarDate(dateStr: string): string {
  return new Date(dateStr)
    .toISOString()
    .replace(/[-:]/g, "")
    .split(".")[0] + "Z";
}

type CalendarEvent = {
  _id?: string;
  title: string;
  details: string;
  startDate: string;
  endDate: string;
  location?: string;
};

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  var params = new URLSearchParams({
    action:  "TEMPLATE",
    text:    event.title,
    dates:   toCalendarDate(event.startDate) + "/" + toCalendarDate(event.endDate),
    details: event.details.slice(0, 1000)
  });
  if (event.location) { params.set("location", event.location); }
  return "https://calendar.google.com/calendar/render?" + params.toString();
}

export function generateICalContent(event: CalendarEvent & { _id: string }): string {
  var start = toCalendarDate(event.startDate);
  var end   = toCalendarDate(event.endDate);
  var now   = toCalendarDate(new Date().toISOString());
  var desc  = event.details.replace(/\r?\n/g, "\\n").slice(0, 500);

  var lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CircleCore//CircleCore//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:" + event._id + "@circlecore",
    "DTSTAMP:" + now,
    "DTSTART:" + start,
    "DTEND:" + end,
    "SUMMARY:" + event.title,
    "DESCRIPTION:" + desc
  ];
  if (event.location) { lines.push("LOCATION:" + event.location); }
  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

export function downloadICal(event: CalendarEvent & { _id: string }): void {
  var content  = generateICalContent(event);
  var blob     = new Blob([content], { type: "text/calendar;charset=utf-8" });
  var url      = URL.createObjectURL(blob);
  var anchor   = document.createElement("a");
  anchor.href  = url;
  anchor.download = event.title.replace(/[^a-z0-9]/gi, "-").toLowerCase() + ".ics";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
