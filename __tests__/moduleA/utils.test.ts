import {
  cn,
  getInitials,
  getAvatarColor,
  truncate,
  isValidUrl,
  formatCount
} from "@/lib/utils";

describe("cn()", () => {
  it("merges class strings",                 () => expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold"));
  it("last Tailwind value wins on conflict", () => expect(cn("text-sm", "text-lg")).toBe("text-lg"));
  it("ignores falsy values",                () => expect(cn("base", false && "x", undefined, "end")).toBe("base end"));
  it("handles empty call",                  () => expect(cn()).toBe(""));
});

describe("getInitials()", () => {
  it("returns 2 initials from full name",   () => expect(getInitials("Azzaz Haider")).toBe("AH"));
  it("returns 1 initial from single name",  () => expect(getInitials("Azzaz")).toBe("A"));
  it("uppercases lowercase names",          () => expect(getInitials("john doe")).toBe("JD"));
  it("uses only first two words",           () => expect(getInitials("John Michael Doe")).toBe("JM"));
});

describe("getAvatarColor()", () => {
  it("returns a bg- Tailwind class",        () => expect(getAvatarColor("Test")).toMatch(/^bg-/));
  it("is deterministic",                    () => expect(getAvatarColor("Alice")).toBe(getAvatarColor("Alice")));
  it("different names produce variety",     () => {
    const colors = ["Alice", "Bob", "Charlie", "Dave", "Eve"].map(getAvatarColor);
    expect(new Set(colors).size).toBeGreaterThan(1);
  });
  it("does not throw on empty string",      () => expect(() => getAvatarColor("")).not.toThrow());
});

describe("truncate()", () => {
  it("returns string unchanged if short",   () => expect(truncate("short", 10)).toBe("short"));
  it("truncates and appends ellipsis",      () => {
    const result = truncate("This is a very long string", 10);
    expect(result.endsWith("\u2026")).toBe(true);
    expect(result.length).toBe(11);
  });
  it("handles exact length boundary",       () => expect(truncate("exactlength", 11)).toBe("exactlength"));
  it("handles empty string",                () => expect(truncate("", 5)).toBe(""));
});

describe("isValidUrl()", () => {
  it("accepts https URL",                   () => expect(isValidUrl("https://example.com")).toBe(true));
  it("accepts http with port",              () => expect(isValidUrl("http://localhost:3000")).toBe(true));
  it("rejects plain text",                  () => expect(isValidUrl("not-a-url")).toBe(false));
  it("rejects empty string",                () => expect(isValidUrl("")).toBe(false));
});

describe("formatCount()", () => {
  it("returns numbers below 1000 as-is",    () => expect(formatCount(999)).toBe("999"));
  it("formats thousands with K suffix",     () => expect(formatCount(1500)).toBe("1.5K"));
  it("formats millions with M suffix",      () => expect(formatCount(2_000_000)).toBe("2.0M"));
  it("handles zero",                        () => expect(formatCount(0)).toBe("0"));
});
