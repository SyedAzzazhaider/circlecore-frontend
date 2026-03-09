import { getInitials, getAvatarColor, formatCount } from "@/lib/utils";

describe("getInitials() for profiles", () => {
  it("handles hyphenated names",    () => expect(getInitials("Mary-Jane Watson")).toBe("MW"));
  it("handles single word",         () => expect(getInitials("Azzaz")).toBe("A"));
  it("handles two words",           () => expect(getInitials("Azzaz Haider")).toBe("AH"));
  it("handles extra whitespace",    () => expect(getInitials("  John  Doe  ")).toBe("JD"));
  it("returns uppercase",           () => expect(getInitials("alice bob")).toBe("AB"));
});

describe("getAvatarColor() for profiles", () => {
  it("always returns a bg- class",  () => expect(getAvatarColor("Azzaz")).toMatch(/^bg-/));
  it("is stable across calls",      () => {
    for (var i = 0; i < 5; i++) {
      expect(getAvatarColor("stable")).toBe(getAvatarColor("stable"));
    }
  });
  it("handles empty string",        () => expect(() => getAvatarColor("")).not.toThrow());
});

describe("formatCount() for stats", () => {
  it("0 stays as 0",                () => expect(formatCount(0)).toBe("0"));
  it("999 stays as 999",            () => expect(formatCount(999)).toBe("999"));
  it("1000 becomes 1.0K",           () => expect(formatCount(1000)).toBe("1.0K"));
  it("1500 becomes 1.5K",           () => expect(formatCount(1500)).toBe("1.5K"));
  it("1000000 becomes 1.0M",        () => expect(formatCount(1000000)).toBe("1.0M"));
  it("2500000 becomes 2.5M",        () => expect(formatCount(2500000)).toBe("2.5M"));
});
