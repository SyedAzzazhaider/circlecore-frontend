"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye, EyeOff, Mail, Lock, User, KeyRound,
  CheckCircle2, XCircle
} from "lucide-react";
import { Button }        from "@/components/ui/Button";
import { Input }         from "@/components/ui/Input";
import { authApi }       from "@/lib/api/auth.api";
import { registerSchema, type RegisterFormData } from "@/lib/validations";
import { getErrorMessage } from "@/lib/api/client";
import { useRecaptcha }    from "@/lib/hooks/useRecaptcha";
import toast from "react-hot-toast";

var OAUTH_PROVIDERS = [
  { id: "google",   label: "Sign up with Google",   bg: "hover:bg-surface-50" },
  { id: "linkedin", label: "Sign up with LinkedIn",  bg: "hover:bg-surface-50" },
  { id: "apple",    label: "Sign up with Apple",     bg: "hover:bg-surface-50" }
];

export default function RegisterPage() {
  const router = useRouter();
  const { getToken } = useRecaptcha();
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const pw = watch("password", "");
  const checks = {
    length:    pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    number:    /[0-9]/.test(pw)
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      var recaptchaToken = await getToken("register");
      await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        inviteCode: data.inviteCode,
        recaptchaToken: recaptchaToken || undefined
      });
      toast.success("Account created — verify your email to continue.");
      router.push("/login?registered=1");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  function handleOAuth(provider: string) {
    var url = authApi.getOAuthUrl(provider as "google" | "apple" | "linkedin");
    window.location.href = url;
  }

  return (
    <div className="auth-card">
      <div className="text-center mb-7">
        <div
          className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center mx-auto mb-4"
          style={{ boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
        >
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="white" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">Create your account</h1>
        <p className="text-sm text-surface-500 mt-1">
          Already a member?{" "}
          <Link href="/login" className="text-brand-600 hover:text-brand-700 font-semibold">
            Sign in
          </Link>
        </p>
      </div>

      {/* OAuth */}
      <div className="space-y-2 mb-5">
        {OAUTH_PROVIDERS.map(function(p) {
          return (
            <button
              key={p.id}
              type="button"
              onClick={function() { handleOAuth(p.id); }}
              className={"w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-surface-200 bg-white " + p.bg + " hover:border-surface-300 transition-all duration-150 text-sm font-medium text-surface-700"}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="divider mb-5">or register with email</div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Full name"
          placeholder="Your full name"
          leftIcon={<User size={14} />}
          error={errors.name?.message}
          autoComplete="name"
          required
          {...register("name")}
        />

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

        <Input
          label="Invite code"
          placeholder="e.g. CIRCL-XXXX-2026"
          leftIcon={<KeyRound size={14} />}
          error={errors.inviteCode?.message}
          hint="You received this from an existing community member."
          required
          {...register("inviteCode")}
        />

        <div>
          <Input
            label="Password"
            type={showPw ? "text" : "password"}
            placeholder="Create a strong password"
            leftIcon={<Lock size={14} />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="text-surface-400 hover:text-surface-600 transition-colors"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
            error={errors.password?.message}
            autoComplete="new-password"
            required
            {...register("password")}
          />

          {pw.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {([
                { key: "length"    as const, label: "At least 8 characters"  },
                { key: "uppercase" as const, label: "One uppercase letter"    },
                { key: "number"    as const, label: "One number"              }
              ]).map(({ key, label }) => (
                <div
                  key={key}
                  className={"flex items-center gap-1.5 text-xs font-medium transition-colors " + (checks[key] ? "text-success-700" : "text-surface-400")}
                >
                  {checks[key]
                    ? <CheckCircle2 size={11} className="shrink-0" />
                    : <XCircle      size={11} className="shrink-0" />
                  }
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" fullWidth size="lg" loading={isSubmitting} className="mt-1">
          Create account
        </Button>

        <p className="text-center text-xs text-surface-400 leading-relaxed">
          By creating an account you agree to our{" "}
          <span className="underline cursor-pointer hover:text-surface-600">Terms</span>
          {" and "}
          <span className="underline cursor-pointer hover:text-surface-600">Privacy Policy</span>.
          Protected by reCAPTCHA.
        </p>
      </form>
    </div>
  );
}
