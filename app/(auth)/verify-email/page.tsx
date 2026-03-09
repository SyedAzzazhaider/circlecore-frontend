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
  const params  = useSearchParams();
  const router  = useRouter();
  const token   = params.get("token");

  const [status, setStatus] = useState<Status>(token ? "verifying" : "no-token");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err: unknown) => {
        setStatus("error");
        setErrMsg(getErrorMessage(err));
      });
  }, [token]);

  return (
    <div className="auth-card text-center">
      {status === "verifying" && (
        <>
          <Loader2 size={36} className="animate-spin text-brand-500 mx-auto mb-5" />
          <h1 className="text-xl font-bold text-surface-900 mb-1.5">Verifying your email…</h1>
          <p className="text-sm text-surface-500">Just a moment.</p>
        </>
      )}

      {status === "no-token" && (
        <>
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-5">
            <Mail size={22} className="text-surface-400" />
          </div>
          <h1 className="text-xl font-bold text-surface-900 mb-1.5">Check your inbox</h1>
          <p className="text-sm text-surface-500 mb-6">
            We sent a verification link to your email. Click it to activate your account.
          </p>
          <p className="text-xs text-surface-400">
            {"Didn't get it? Check spam or "}
            <Link href="/login" className="text-brand-600 font-semibold">sign in again</Link>.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-12 h-12 rounded-2xl bg-success-50 border border-success-500/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={26} className="text-success-500" />
          </div>
          <h1 className="text-xl font-bold text-surface-900 mb-1.5">Email verified!</h1>
          <p className="text-sm text-surface-500 mb-8">
            Your account is active. Sign in to join your community.
          </p>
          <Button fullWidth size="lg" onClick={() => router.push("/login")}>
            Sign in now
          </Button>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-12 h-12 rounded-2xl bg-danger-50 border border-danger-500/20 flex items-center justify-center mx-auto mb-5">
            <XCircle size={26} className="text-danger-500" />
          </div>
          <h1 className="text-xl font-bold text-surface-900 mb-1.5">Verification failed</h1>
          <p className="text-sm text-surface-500 mb-1.5">{errMsg || "This link may have expired."}</p>
          <p className="text-xs text-surface-400 mb-8">Links expire after 24 hours.</p>
          <Button variant="secondary" fullWidth size="lg" onClick={() => router.push("/login")}>
            Back to sign in
          </Button>
        </>
      )}
    </div>
  );
}
