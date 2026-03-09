"use client";
import { useRef, useState } from "react";
import type { KeyboardEvent, ClipboardEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button }   from "@/components/ui/Button";
import { authApi }  from "@/lib/api/auth.api";
import { getErrorMessage } from "@/lib/api/client";
import { useAuthStore }    from "@/lib/store/auth.store";
import toast from "react-hot-toast";
import Link from "next/link";

export default function TwoFactorPage() {
  const params      = useSearchParams();
  const router      = useRouter();
  const { setAuth } = useAuthStore();
  const token       = params.get("token") ?? "";

  const [digits, setDigits]   = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const focus = (i: number) => refs.current[i]?.focus();

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    setError("");
    if (val && i < 5) focus(i + 1);
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace"  && !digits[i] && i > 0) focus(i - 1);
    if (e.key === "ArrowLeft"  && i > 0) focus(i - 1);
    if (e.key === "ArrowRight" && i < 5) focus(i + 1);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const raw = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (raw.length === 6) {
      setDigits(raw.split(""));
      focus(5);
    }
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length < 6) { setError("Please enter all 6 digits."); return; }
    if (!token) { toast.error("Session expired. Sign in again."); router.push("/login"); return; }

    setLoading(true);
    try {
      const { data: res } = await authApi.verifyTwoFactor({ twoFactorTempToken: token, code });
      const p = res.data;
      setAuth(p.user, p.accessToken, p.refreshToken);
      toast.success(`Welcome back, ${p.user.name.split(" ")[0]}!`);
      router.push("/feed");
    } catch (err) {
      setError(getErrorMessage(err));
      setDigits(Array(6).fill(""));
      focus(0);
    } finally {
      setLoading(false);
    }
  };

  const filled = digits.filter(Boolean).length;

  return (
    <div className="auth-card text-center">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-5">
        <ShieldCheck size={22} className="text-brand-600" />
      </div>

      <h1 className="text-xl font-bold text-surface-900 tracking-tight mb-1.5">
        Two-factor verification
      </h1>
      <p className="text-sm text-surface-500 mb-8">
        Enter the 6-digit code from your authenticator app.
      </p>

      <div className="flex gap-2 justify-center mb-4">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${i + 1}`}
            className={[
              "w-11 h-12 text-center text-xl font-bold rounded-xl border transition-all duration-150",
              "focus:outline-none",
              error
                ? "border-danger-400 bg-danger-50 text-danger-700"
                : d
                  ? "border-brand-400 bg-brand-50 text-brand-800"
                  : "border-surface-200 bg-white text-surface-900"
            ].join(" ")}
            style={
              !error && !d
                ? { boxShadow: "none" }
                : !error && d
                  ? { boxShadow: "0 0 0 3px rgba(99,102,241,0.12)" }
                  : { boxShadow: "0 0 0 3px rgba(239,68,68,0.12)" }
            }
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface-100 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-300"
          style={{ width: `${(filled / 6) * 100}%` }}
        />
      </div>

      {error && <p className="text-sm text-danger-600 font-medium mb-4">{error}</p>}

      <Button onClick={handleVerify} fullWidth size="lg" loading={loading} disabled={filled < 6}>
        Verify code
      </Button>

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 mt-5 text-xs text-surface-400 hover:text-surface-700 transition-colors font-medium"
      >
        <ArrowLeft size={12} />
        Back to sign in
      </Link>
    </div>
  );
}
