"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input  } from "@/components/ui/Input";
import { authApi } from "@/lib/api/auth.api";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations";
import { getErrorMessage } from "@/lib/api/client";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  var [sent,  setSent]  = useState(false);
  var [email, setEmail] = useState("");

  var {
    register, handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) });

  var onSubmit = async function(data: ForgotPasswordFormData) {
    try {
      await authApi.forgotPassword(data.email);
      setEmail(data.email); setSent(true);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (sent) {
    return (
      <div className="auth-card text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center mx-auto mb-5"
          style={{ boxShadow: "0 0 24px rgba(16,185,129,0.15)" }}>
          <CheckCircle2 size={26} className="text-emerald-400" />
        </div>
        <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase mb-1.5">Email sent</p>
        <h1 className="text-2xl font-black text-white tracking-tight mb-2">Check your inbox</h1>
        <p className="text-sm text-slate-400 mb-1">We sent a reset link to</p>
        <p className="text-sm font-bold text-white mb-6">{email}</p>
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/8 text-left mb-7">
          <p className="text-xs text-slate-400 leading-relaxed">
            The link expires in <span className="font-semibold text-slate-200">1 hour</span>. Check your spam folder if you do not see it within a few minutes.
          </p>
        </div>
        <Link href="/login">
          <Button variant="secondary" fullWidth size="lg" leftIcon={<ArrowLeft size={13} />}>
            Back to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <Link href="/login"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-semibold mb-7">
        <ArrowLeft size={12} />Back to sign in
      </Link>

      <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center mb-5">
        <Send size={15} className="text-indigo-400" />
      </div>

      <p className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-1.5">Password reset</p>
      <h1 className="text-[1.6rem] font-black text-white tracking-tight mb-2">Forgot your password?</h1>
      <p className="text-sm text-slate-400 mb-7 leading-relaxed">
        Enter your email address and we will send you a secure link to reset it.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail size={14} />}
          error={errors.email?.message}
          autoComplete="email"
          required
          {...register("email")}
        />
        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </div>
  );
}