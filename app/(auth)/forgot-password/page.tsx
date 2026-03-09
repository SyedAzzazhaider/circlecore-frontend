"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input  } from "@/components/ui/Input";
import { authApi } from "@/lib/api/auth.api";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations";
import { getErrorMessage } from "@/lib/api/client";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [sent, setSent]     = useState(false);
  const [email, setEmail]   = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await authApi.forgotPassword(data.email);
      setEmail(data.email);
      setSent(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (sent) {
    return (
      <div className="auth-card text-center">
        <div className="w-12 h-12 rounded-2xl bg-success-50 border border-success-500/20 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={26} className="text-success-500" />
        </div>
        <h1 className="text-xl font-bold text-surface-900 mb-1.5">Check your email</h1>
        <p className="text-sm text-surface-500 mb-1">We sent a reset link to</p>
        <p className="text-sm font-semibold text-surface-800 mb-8">{email}</p>
        <p className="text-xs text-surface-400 mb-6">
          Link expires in 1 hour. Check spam if you do not see it.
        </p>
        <Link href="/login">
          <Button variant="secondary" fullWidth size="lg" leftIcon={<ArrowLeft size={14} />}>
            Back to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-700 transition-colors font-medium mb-7"
      >
        <ArrowLeft size={12} />
        Back to sign in
      </Link>

      <h1 className="text-xl font-bold text-surface-900 tracking-tight mb-1">
        Reset your password
      </h1>
      <p className="text-sm text-surface-500 mb-8">
        Enter your email and we will send a reset link.
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
