import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  profileUpdateSchema
} from "@/lib/validations/profile";

describe("onboardingStep1Schema", () => {
  it("passes with all empty optional fields",
    () => expect(onboardingStep1Schema.safeParse({ bio: "", location: "", website: "" }).success).toBe(true));
  it("passes with valid bio",
    () => expect(onboardingStep1Schema.safeParse({ bio: "I build things", location: "", website: "" }).success).toBe(true));
  it("fails — bio exceeds 300 chars",
    () => expect(onboardingStep1Schema.safeParse({ bio: "x".repeat(301) }).success).toBe(false));
  it("fails — invalid website URL",
    () => expect(onboardingStep1Schema.safeParse({ website: "not-a-url" }).success).toBe(false));
  it("passes — valid website URL",
    () => expect(onboardingStep1Schema.safeParse({ website: "https://example.com" }).success).toBe(true));
});

describe("onboardingStep2Schema", () => {
  it("passes with valid skills array",
    () => expect(onboardingStep2Schema.safeParse({ skills: ["React", "TypeScript"] }).success).toBe(true));
  it("fails — empty skills array",
    () => expect(onboardingStep2Schema.safeParse({ skills: [] }).success).toBe(false));
  it("fails — more than 15 skills",
    () => expect(onboardingStep2Schema.safeParse({ skills: Array(16).fill("skill") }).success).toBe(false));
  it("passes — exactly 15 skills",
    () => expect(onboardingStep2Schema.safeParse({ skills: Array(15).fill("skill") }).success).toBe(true));
});

describe("onboardingStep3Schema", () => {
  it("passes with valid interests",
    () => expect(onboardingStep3Schema.safeParse({ interests: ["AI & ML", "Startups"] }).success).toBe(true));
  it("fails — empty interests array",
    () => expect(onboardingStep3Schema.safeParse({ interests: [] }).success).toBe(false));
  it("fails — more than 10 interests",
    () => expect(onboardingStep3Schema.safeParse({ interests: Array(11).fill("x") }).success).toBe(false));
});

describe("profileUpdateSchema", () => {
  var V = { name: "Azzaz Haider" };
  it("passes with just a name",
    () => expect(profileUpdateSchema.safeParse(V).success).toBe(true));
  it("fails — name too short",
    () => expect(profileUpdateSchema.safeParse({ name: "A" }).success).toBe(false));
  it("fails — invalid website",
    () => expect(profileUpdateSchema.safeParse({ ...V, website: "bad-url" }).success).toBe(false));
  it("passes — valid website",
    () => expect(profileUpdateSchema.safeParse({ ...V, website: "https://site.com" }).success).toBe(true));
  it("passes — empty website",
    () => expect(profileUpdateSchema.safeParse({ ...V, website: "" }).success).toBe(true));
});
