"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, CheckCircle2, XCircle, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input  } from "@/components/ui/Input";
import { authApi } from "@/lib/api/auth.api";
import { getErrorMessage } from "@/lib/api/client";
import Link from "next/link";
import toast from "react-hot-toast";

var PW_CHECKS = [
  { label: "8+ characters",    test: function(p: string) { return p.length >= 8; }           },
  { label: "Uppercase letter", test: function(p: string) { return /[A-Z]/.test(p); }         },
  { label: "One number",       test: function(p: string) { return /[0-9]/.test(p); }         },
  { label: "Special character",test: function(p: string) { return /[^A-Za-z0-9]/.test(p); } }
];
var STRENGTH = [
  { bar: "bg-red-400",    label: "Weak",   text: "text-red-400"    },
  { bar: "bg-amber-400",  label: "Fair",   text: "text-amber-400"  },
  { bar: "bg-yellow-400", label: "Good",   text: "text-yellow-400" },
  { bar: "bg-emerald-500",label: "Strong", text: "text-emerald-400"}
];

function ResetPasswordInner() {
  var params   = useSearchParams();
  var router   = useRouter();
  var token    = params.get("token");
  var [pw,      setPw]      = useState("");
  var [confirm, setConfirm] = useState("");
  var [showPw,  setShowPw]  = useState(false);
  var [showCf,  setShowCf]  = useState(false);
  var [loading, setLoading] = useState(false);
  var [success, setSuccess] = useState(false);

  var score    = PW_CHECKS.filter(function(c) { return c.test(pw); }).length;
  var meta     = score > 0 ? STRENGTH[score - 1] : null;
  var mismatch = confirm.length > 0 && confirm !== pw;

  if (!token) return (
    <div className="auth-card text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto mb-5">
        <XCircle size={28} className="text-red-400" />
      </div>
      <p className="text-[10px] font-bold text-red-400 tracking-widest uppercase mb-1.5">Invalid link</p>
      <h1 className="text-2xl font-black text-white tracking-tight mb-2">Link not valid</h1>
      <p className="text-sm text-slate-400 mb-8 leading-relaxed">
        This reset link is missing or has already been used. Request a new one from the sign-in page.
      </p>
      <Link href="/forgot-password">
        <Button fullWidth size="lg">Request new link</Button>
      </Link>
    </div>
  );

  if (success) return (
    <div className="auth-card text-center">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center mx-auto mb-5"
        style={{ boxShadow: "0 0 28px rgba(16,185,129,0.18)" }}>
        <CheckCircle2 size={28} className="text-emerald-400" />
      </div>
      <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase mb-1.5">All set</p>
      <h1 className="text-2xl font-black text-white tracking-tight mb-2">Password updated!</h1>
      <p className="text-sm text-slate-400 mb-8 leading-relaxed">
        Your password has been changed successfully. You can now sign in with your new credentials.
      </p>
      <Button fullWidth size="lg" onClick={function() { router.push("/login"); }}>
        Sign in now
      </Button>
    </div>
  );

  async function handleSubmit() {
    if (score < 4) { toast.error("Password does not meet all requirements"); return; }
    if (confirm !== pw) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token!, pw);
      setSuccess(true);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-card">
      <Link href="/login"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-semibold mb-7">
        <ArrowLeft size={12} />Back to sign in
      </Link>

      <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center mb-5">
        <KeyRound size={15} className="text-indigo-400" />
      </div>

      <p className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-1.5">New password</p>
      <h1 className="text-[1.6rem] font-black text-white tracking-tight mb-2">Set a new password</h1>
      <p className="text-sm text-slate-400 mb-7 leading-relaxed">
        Choose a strong new password to secure your CircleCore account.
      </p>

      <div className="space-y-4">
        <div>
          <Input
            label="New password"
            type={showPw ? "text" : "password"}
            placeholder="Create a strong password"
            leftIcon={<Lock size={14} />}
            value={pw}
            onChange={function(e) { setPw(e.target.value); }}
            autoComplete="new-password"
            rightElement={
              <button type="button" onClick={function() { setShowPw(function(v) { return !v; }); }}
                className="text-slate-500 hover:text-slate-300 transition-colors">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
          />
          {pw.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-1 items-center">
                {[0,1,2,3].map(function(i) {
                  return <div key={i} className={"h-0.5 flex-1 rounded-full transition-all duration-300 " + (i < score && meta ? meta.bar : "bg-white/10")} />;
                })}
                {meta && <span className={"text-[10px] font-bold ml-2 shrink-0 " + meta.text}>{meta.label}</span>}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {PW_CHECKS.map(function(c) {
                  var ok = c.test(pw);
                  return (
                    <div key={c.label} className="flex items-center gap-1.5">
                      {ok ? <CheckCircle2 size={10} className="text-emerald-400 shrink-0" /> : <XCircle size={10} className="text-slate-600 shrink-0" />}
                      <span className={"text-[10px] font-medium " + (ok ? "text-emerald-400" : "text-slate-500")}>{c.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Input
          label="Confirm new password"
          type={showCf ? "text" : "password"}
          placeholder="Re-enter your new password"
          leftIcon={<Lock size={14} />}
          value={confirm}
          onChange={function(e) { setConfirm(e.target.value); }}
          autoComplete="new-password"
          error={mismatch ? "Passwords do not match" : undefined}
          rightElement={
            <button type="button" onClick={function() { setShowCf(function(v) { return !v; }); }}
              className="text-slate-500 hover:text-slate-300 transition-colors">
              {showCf ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
        />

        <Button fullWidth size="lg" loading={loading}
          disabled={score < 4 || !confirm || mismatch}
          onClick={handleSubmit}>
          Update password
        </Button>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="auth-card flex items-center justify-center py-10">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordInner />
    </Suspense>
  );
}