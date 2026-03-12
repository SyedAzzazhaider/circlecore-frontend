"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { Button }  from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth.api";
import { getErrorMessage } from "@/lib/api/client";
import Link from "next/link";

type Status = "verifying" | "success" | "error" | "no-token";

export default function VerifyEmailPage() {
  var params  = useSearchParams();
  var router  = useRouter();
  var token   = params.get("token");
  var [status, setStatus] = useState<Status>(token ? "verifying" : "no-token");
  var [errMsg, setErrMsg] = useState("");

  useEffect(function() {
    if (!token) return;
    authApi.verifyEmail(token)
      .then(function() { setStatus("success"); })
      .catch(function(err: unknown) { setStatus("error"); setErrMsg(getErrorMessage(err)); });
  }, [token]);

  return (
    <div className="auth-card text-center">

      {status === "verifying" && (
        <>
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/12 border border-indigo-500/25 flex items-center justify-center mx-auto mb-5">
            <Loader2 size={26} className="animate-spin text-indigo-400" />
          </div>
          <p className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-1.5">Please wait</p>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">Verifying your email&hellip;</h1>
          <p className="text-sm text-slate-400">Confirming your address, just a moment.</p>
        </>
      )}

      {status === "no-token" && (
        <>
          <div className="w-14 h-14 rounded-2xl bg-white/8 border border-white/12 flex items-center justify-center mx-auto mb-5">
            <Mail size={26} className="text-slate-400" />
          </div>
          <p className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-1.5">Verify your email</p>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">Check your inbox</h1>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            We sent a verification link to your email address.<br />Click it to activate your CircleCore account.
          </p>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/8 text-left mb-6">
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-200">Did not receive it?</span> Check your spam folder. Links expire after 24 hours.
            </p>
          </div>
          <Link href="/login" className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Back to sign in
          </Link>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center mx-auto mb-5"
            style={{ boxShadow: "0 0 28px rgba(16,185,129,0.18)" }}>
            <CheckCircle2 size={28} className="text-emerald-400" />
          </div>
          <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase mb-1.5">Verified</p>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">Email verified!</h1>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Your account is now active. Sign in to join your community and start connecting.
          </p>
          <Button fullWidth size="lg" onClick={function() { router.push("/login"); }}>
            Sign in now
          </Button>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto mb-5">
            <XCircle size={28} className="text-red-400" />
          </div>
          <p className="text-[10px] font-bold text-red-400 tracking-widest uppercase mb-1.5">Failed</p>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">Verification failed</h1>
          <p className="text-sm text-slate-400 mb-2">{errMsg || "This link may have expired or already been used."}</p>
          <p className="text-xs text-slate-600 mb-8">Links expire after 24 hours.</p>
          <Button variant="secondary" fullWidth size="lg" onClick={function() { router.push("/login"); }}>
            Back to sign in
          </Button>
        </>
      )}

    </div>
  );
}