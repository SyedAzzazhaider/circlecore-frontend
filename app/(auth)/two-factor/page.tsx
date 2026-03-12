"use client";

import { Suspense, useRef, useState } from "react";
import type { KeyboardEvent, ClipboardEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button }  from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth.api";
import { getErrorMessage } from "@/lib/api/client";
import { useAuthStore }    from "@/lib/store/auth.store";
import toast from "react-hot-toast";
import Link from "next/link";

function TwoFactorContent() {
  var params      = useSearchParams();
  var router      = useRouter();
  var { setAuth } = useAuthStore();
  var token       = params.get("token") ?? "";

  var [digits,  setDigits]  = useState<string[]>(Array(6).fill(""));
  var [loading, setLoading] = useState(false);
  var [error,   setError]   = useState("");
  var refs = useRef<Array<HTMLInputElement | null>>([]);

  var focus = function(i: number) { refs.current[i]?.focus(); };

  var handleChange = function(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    var next = [...digits]; next[i] = val;
    setDigits(next); setError("");
    if (val && i < 5) focus(i + 1);
  };

  var handleKey = function(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace"  && !digits[i] && i > 0) focus(i - 1);
    if (e.key === "ArrowLeft"  && i > 0) focus(i - 1);
    if (e.key === "ArrowRight" && i < 5) focus(i + 1);
  };

  var handlePaste = function(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    var raw = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (raw.length === 6) { setDigits(raw.split("")); focus(5); }
  };

  var handleVerify = async function() {
    var code = digits.join("");
    if (code.length < 6) { setError("Please enter all 6 digits."); return; }
    if (!token) { toast.error("Session expired. Sign in again."); router.push("/login"); return; }
    setLoading(true);
    try {
      var { data: res } = await authApi.verifyTwoFactor({ twoFactorTempToken: token, code: code });
      var p = res.data;
      setAuth(p.user, p.accessToken, p.refreshToken);
      toast.success("Welcome back, " + p.user.name.split(" ")[0] + "!");
      router.push("/feed");
    } catch (err) {
      setError(getErrorMessage(err));
      setDigits(Array(6).fill(""));
      focus(0);
    } finally { setLoading(false); }
  };

  var filled = digits.filter(Boolean).length;

  return (
    <div className="auth-card text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/12 border border-indigo-500/25 flex items-center justify-center mx-auto mb-5"
        style={{ boxShadow: "0 0 28px rgba(99,102,241,0.18)" }}>
        <ShieldCheck size={26} className="text-indigo-400" />
      </div>

      <p className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-1.5">Security check</p>
      <h1 className="text-[1.6rem] font-black text-white tracking-tight mb-2">Two-factor verification</h1>
      <p className="text-sm text-slate-400 mb-8 leading-relaxed">
        Enter the 6-digit code from<br />your authenticator app.
      </p>

      <div className="flex gap-2.5 justify-center mb-4">
        {digits.map(function(d, i) {
          return (
            <input
              key={i}
              ref={function(el) { refs.current[i] = el; }}
              type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={function(e) { handleChange(i, e.target.value); }}
              onKeyDown={function(e) { handleKey(i, e); }}
              onPaste={handlePaste}
              aria-label={"Digit " + (i + 1)}
              className={[
                "w-11 h-12 text-center text-lg font-black rounded-xl border-2 transition-all duration-150 outline-none",
                error
                  ? "border-red-500/50 bg-red-500/10 text-red-300"
                  : d
                    ? "border-indigo-400/60 bg-indigo-500/12 text-indigo-100"
                    : "border-white/10 bg-white/6 text-white hover:border-white/20"
              ].join(" ")}
              style={
                !error && d
                  ? { boxShadow: "0 0 0 3px rgba(99,102,241,0.18)" }
                  : error
                    ? { boxShadow: "0 0 0 3px rgba(239,68,68,0.15)" }
                    : {}
              }
            />
          );
        })}
      </div>

      <div className="h-0.5 bg-white/8 rounded-full mb-5 mx-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
          style={{ width: ((filled / 6) * 100) + "%" }} />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
          <p className="text-sm text-red-400 font-semibold">{error}</p>
        </div>
      )}

      <Button onClick={handleVerify} fullWidth size="lg" loading={loading} disabled={filled < 6}>
        Verify code
      </Button>

      <Link href="/login"
        className="inline-flex items-center gap-1.5 mt-5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-semibold">
        <ArrowLeft size={11} />Back to sign in
      </Link>
    </div>
  );
}

export default function TwoFactorPage() {
  return (
    <Suspense fallback={<div className="auth-card" />}>
      <TwoFactorContent />
    </Suspense>
  );
}