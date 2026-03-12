import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  twoFactorSchema
} from "@/lib/validations";

describe("registerSchema", () => {
  const V = {
    name:       "Azzaz Haider",
    email:      "a@b.com",
    password:   "StrongPass1",
    inviteCode: "CODE1234"
  };

  it("passes with valid data",             () => expect(registerSchema.safeParse(V).success).toBe(true));
  it("fails — name too short",             () => expect(registerSchema.safeParse({ ...V, name: "A" }).success).toBe(false));
  it("fails — name too long",              () => expect(registerSchema.safeParse({ ...V, name: "A".repeat(51) }).success).toBe(false));
  it("fails — invalid email",              () => expect(registerSchema.safeParse({ ...V, email: "bad" }).success).toBe(false));
  it("fails — empty email",                () => expect(registerSchema.safeParse({ ...V, email: "" }).success).toBe(false));
  it("fails — password under 8 chars",     () => expect(registerSchema.safeParse({ ...V, password: "Sh0rt" }).success).toBe(false));
  it("fails — password no uppercase",      () => expect(registerSchema.safeParse({ ...V, password: "weakpass1" }).success).toBe(false));
  it("fails — password no number",         () => expect(registerSchema.safeParse({ ...V, password: "NoNumbers" }).success).toBe(false));
  it("fails — invite code under 4 chars",  () => expect(registerSchema.safeParse({ ...V, inviteCode: "AB" }).success).toBe(false));
  it("fails — missing all fields",         () => expect(registerSchema.safeParse({}).success).toBe(false));
});

describe("loginSchema", () => {
  const V = { email: "test@example.com", password: "anypass" };

  it("passes with valid data",  () => expect(loginSchema.safeParse(V).success).toBe(true));
  it("fails — invalid email",   () => expect(loginSchema.safeParse({ ...V, email: "bad" }).success).toBe(false));
  it("fails — empty password",  () => expect(loginSchema.safeParse({ ...V, password: "" }).success).toBe(false));
  it("fails — empty object",    () => expect(loginSchema.safeParse({}).success).toBe(false));
});

describe("forgotPasswordSchema", () => {
  it("passes — valid email",   () => expect(forgotPasswordSchema.safeParse({ email: "u@x.com" }).success).toBe(true));
  it("fails — invalid email",  () => expect(forgotPasswordSchema.safeParse({ email: "bad" }).success).toBe(false));
  it("fails — empty email",    () => expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false));
});

describe("resetPasswordSchema", () => {
  const V = { password: "NewPass123", confirmPassword: "NewPass123" };

  it("passes — matching strong passwords", () => expect(resetPasswordSchema.safeParse(V).success).toBe(true));
  it("fails — passwords mismatch",         () => {
    const r = resetPasswordSchema.safeParse({ ...V, confirmPassword: "Different1" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.path).toContain("confirmPassword");
    }
  });
  it("fails — too short",      () => expect(resetPasswordSchema.safeParse({ password: "Sh0rt",    confirmPassword: "Sh0rt"    }).success).toBe(false));
  it("fails — no uppercase",   () => expect(resetPasswordSchema.safeParse({ password: "weakpass1", confirmPassword: "weakpass1" }).success).toBe(false));
  it("fails — no number",      () => expect(resetPasswordSchema.safeParse({ password: "NoNumbers", confirmPassword: "NoNumbers" }).success).toBe(false));
});

describe("twoFactorSchema", () => {
  it("passes — valid 6-digit code",     () => expect(twoFactorSchema.safeParse({ code: "123456" }).success).toBe(true));
  it("passes — code with leading zero", () => expect(twoFactorSchema.safeParse({ code: "001234" }).success).toBe(true));
  it("fails — only 5 digits",           () => expect(twoFactorSchema.safeParse({ code: "12345" }).success).toBe(false));
  it("fails — 7 digits",                () => expect(twoFactorSchema.safeParse({ code: "1234567" }).success).toBe(false));
  it("fails — contains a letter",       () => expect(twoFactorSchema.safeParse({ code: "12345a" }).success).toBe(false));
  it("fails — empty string",            () => expect(twoFactorSchema.safeParse({ code: "" }).success).toBe(false));
  it("fails — contains a space",        () => expect(twoFactorSchema.safeParse({ code: "123 45" }).success).toBe(false));
});
