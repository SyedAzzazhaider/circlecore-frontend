import { formatCount, isValidUrl } from "@/lib/utils";

describe("community slug safety", () => {
  it("valid HTTPS community URL passes",    () => expect(isValidUrl("https://circlecore.app/communities/founders")).toBe(true));
  it("rejects empty slug URL",             () => expect(isValidUrl("")).toBe(false));
  it("rejects non-URL string as slug",     () => expect(isValidUrl("just-a-slug")).toBe(false));
});

describe("community member count display", () => {
  it("0 members shows 0",                  () => expect(formatCount(0)).toBe("0"));
  it("500 members shows 500",              () => expect(formatCount(500)).toBe("500"));
  it("12500 members shows 12.5K",          () => expect(formatCount(12500)).toBe("12.5K"));
  it("2100000 members shows 2.1M",         () => expect(formatCount(2100000)).toBe("2.1M"));
});
