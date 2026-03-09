import { formatCount, truncate } from "@/lib/utils";

describe("formatCount() for feed stats", () => {
  it("formats 0 correctly",            () => expect(formatCount(0)).toBe("0"));
  it("formats 42 correctly",           () => expect(formatCount(42)).toBe("42"));
  it("formats 999 correctly",          () => expect(formatCount(999)).toBe("999"));
  it("formats 1000 as 1.0K",           () => expect(formatCount(1000)).toBe("1.0K"));
  it("formats 5400 as 5.4K",           () => expect(formatCount(5400)).toBe("5.4K"));
  it("formats 1000000 as 1.0M",        () => expect(formatCount(1000000)).toBe("1.0M"));
  it("formats 3700000 as 3.7M",        () => expect(formatCount(3700000)).toBe("3.7M"));
});

describe("truncate() for post previews", () => {
  it("does not truncate short content",        () => expect(truncate("short", 100)).toBe("short"));
  it("truncates long post titles",             () => {
    var result = truncate("This is a very long post title that exceeds the limit", 20);
    expect(result.length).toBe(21);
    expect(result.endsWith("\u2026")).toBe(true);
  });
  it("handles empty string",                   () => expect(truncate("", 50)).toBe(""));
  it("handles exact boundary without ellipsis",() => expect(truncate("exact", 5)).toBe("exact"));
});
