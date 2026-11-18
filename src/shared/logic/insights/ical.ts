export type CalendarEvent = {
  uid: string;
  title: string;
  date: Date;
  description?: string;
  url?: string;
};

const escapeText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

const ymd = (date: Date) => date.toISOString().slice(0, 10).replace(/-/g, "");
const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Fold lines longer than 75 octets, as RFC 5545 requires. */
function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const charSize = new TextEncoder().encode(char).length;
    if (size + charSize > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += charSize;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** An all-day iCalendar feed. Calendar apps poll it, so deadlines stay current without a sync. */
export function buildICalendar(name: string, events: CalendarEvent[], now: Date = new Date()) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agile Pulse//Deadlines//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
  ];
  for (const event of events) {
    const next = new Date(event.date.getTime());
    next.setUTCDate(next.getUTCDate() + 1);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${ymd(event.date)}`,
      `DTEND;VALUE=DATE:${ymd(next)}`,
      `SUMMARY:${escapeText(event.title)}`,
      ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
      ...(event.url ? [`URL:${event.url}`] : []),
      "TRANSP:TRANSPARENT",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
