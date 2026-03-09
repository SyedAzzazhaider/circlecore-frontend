"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button }   from "@/components/ui/Button";
import { Input }    from "@/components/ui/Input";
import { authApi }  from "@/lib/api/auth.api";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { getErrorMessage } from "@/lib/api/client";
import { useAuthStore }    from "@/lib/store/auth.store";
import { useRecaptcha }    from "@/lib/hooks/useRecaptcha";
import toast from "react-hot-toast";

var OAUTH_PROVIDERS = [
  {
    id: "google",
    label: "Continue with Google",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
    )
  },
  {
    id: "linkedin",
    label: "Continue with LinkedIn",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect width="18" height="18" rx="3" fill="#0077B5"/>
        <path d="M5.5 7.5H3.5V14H5.5V7.5ZM4.5 6.5C5.05 6.5 5.5 6.05 5.5 5.5C5.5 4.95 5.05 4.5 4.5 4.5C3.95 4.5 3.5 4.95 3.5 5.5C3.5 6.05 3.95 6.5 4.5 6.5ZM14.5 14H12.5V10.75C12.5 9.92 12.48 8.87 11.36 8.87C10.22 8.87 10.05 9.77 10.05 10.69V14H8.05V7.5H9.97V8.46H9.99C10.26 7.96 10.91 7.42 11.88 7.42C13.91 7.42 14.5 8.75 14.5 10.49V14Z" fill="white"/>
      </svg>
    )
  },
  {
    id: "apple",
    label: "Continue with Apple",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M14.045 9.539c-.017-1.972 1.612-2.929 1.686-2.977-1.229-1.417-2.614-1.418-2.614-1.418-1.105-.113-2.172.655-2.733.655-.561 0-1.418-.643-2.338-.625-1.193.017-2.303.697-2.917 1.761-1.253 2.163-.319 5.362.892 7.115.595.859 1.302 1.818 2.225 1.784.896-.035 1.232-.574 2.316-.574 1.084 0 1.385.574 2.334.558.964-.017 1.568-.866 2.156-1.727.682-.987.963-1.945.979-2.001-.021-.009-1.968-.753-1.986-2.551z" fill="currentColor"/>
        <path d="M12.373 3.768c.495-.597.829-1.427.737-2.254-.713.028-1.576.474-2.088 1.071-.458.531-.861 1.381-.753 2.196.795.061 1.609-.404 2.104-1.013z" fill="currentColor"/>
      </svg>
    )
  }
];

export default function LoginPage() {
  const router      = useRouter();
  const params      = useSearchParams();
  const { setAuth } = useAuthStore();
  const { getToken } = useRecaptcha();
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const isTimeout  = params.get("reason") === "timeout";
  const registered = params.get("registered");

  const onSubmit = async (data: LoginFormData) => {
    try {
      var recaptchaToken = await getToken("login");
      const { data: res } = await authApi.login({
        email: data.email,
        password: data.password,
        recaptchaToken: recaptchaToken || undefined
      });
      const payload = res.data;

      if (payload.requiresTwoFactor) {
        router.push("/two-factor?token=" + (payload.twoFactorTempToken ?? ""));
        return;
      }

      setAuth(payload.user, payload.accessToken, payload.refreshToken);
      toast.success("Welcome back, " + payload.user.name.split(" ")[0] + "!");
      router.push("/feed");
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
      {isTimeout && (
        <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-warning-50 border border-warning-500/20">
          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-px" />
          <p className="text-sm text-amber-800 font-medium">
            You were signed out due to inactivity. Please sign in again.
          </p>
        </div>
      )}

      {registered && (
        <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-success-50 border border-success-500/20">
          <CheckCircle2 size={14} className="text-success-600 shrink-0 mt-px" />
          <p className="text-sm text-success-800 font-medium">
            Account created! Verify your email before signing in.
          </p>
        </div>
      )}

      <div className="text-center mb-7">
        <div
          className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center mx-auto mb-4"
          style={{ boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
        >
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="white" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">Welcome back</h1>
        <p className="text-sm text-surface-500 mt-1">
          New here?{" "}
          <Link href="/register" className="text-brand-600 hover:text-brand-700 font-semibold">
            Register with invite code
          </Link>
        </p>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-2 mb-5">
        {OAUTH_PROVIDERS.map(function(provider) {
          return (
            <button
              key={provider.id}
              type="button"
              onClick={function() { handleOAuth(provider.id); }}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 hover:border-surface-300 transition-all duration-150 text-sm font-medium text-surface-700"
            >
              {provider.icon}
              {provider.label}
            </button>
          );
        })}
      </div>

      <div className="divider mb-5">or sign in with email</div>

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

        <div>
          <Input
            label="Password"
            type={showPw ? "text" : "password"}
            placeholder="Your password"
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
            autoComplete="current-password"
            required
            {...register("password")}
          />
          <div className="flex justify-end mt-1.5">
            <Link
              href="/forgot-password"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Sign in to CircleCore
        </Button>

        <p className="text-center text-xs text-surface-400">
          Protected by reCAPTCHA.{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy</a>
          {" & "}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">Terms</a>
        </p>
      </form>
    </div>
  );
}
