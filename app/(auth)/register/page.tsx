"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, User, KeyRound, CheckCircle2, XCircle } from "lucide-react";
import { Button }   from "@/components/ui/Button";
import { Input }    from "@/components/ui/Input";
import { authApi }  from "@/lib/api/auth.api";
import { registerSchema, type RegisterFormData } from "@/lib/validations";
import { getErrorMessage } from "@/lib/api/client";
import { useRecaptcha }    from "@/lib/hooks/useRecaptcha";
import toast from "react-hot-toast";

var GOOGLE_ICON = (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

var LINKEDIN_ICON = (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
    <rect width="18" height="18" rx="3" fill="#0077B5"/>
    <path d="M5.5 7.5H3.5V14H5.5V7.5ZM4.5 6.5C5.05 6.5 5.5 6.05 5.5 5.5C5.5 4.95 5.05 4.5 4.5 4.5C3.95 4.5 3.5 4.95 3.5 5.5C3.5 6.05 3.95 6.5 4.5 6.5ZM14.5 14H12.5V10.75C12.5 9.92 12.48 8.87 11.36 8.87C10.22 8.87 10.05 9.77 10.05 10.69V14H8.05V7.5H9.97V8.46H9.99C10.26 7.96 10.91 7.42 11.88 7.42C13.91 7.42 14.5 8.75 14.5 10.49V14Z" fill="white"/>
  </svg>
);

var APPLE_ICON = (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="rgba(255,255,255,0.9)">
    <path d="M14.045 9.539c-.017-1.972 1.612-2.929 1.686-2.977-1.229-1.417-2.614-1.418-2.614-1.418-1.105-.113-2.172.655-2.733.655-.561 0-1.418-.643-2.338-.625-1.193.017-2.303.697-2.917 1.761-1.253 2.163-.319 5.362.892 7.115.595.859 1.302 1.818 2.225 1.784.896-.035 1.232-.574 2.316-.574 1.084 0 1.385.574 2.334.558.964-.017 1.568-.866 2.156-1.727.682-.987.963-1.945.979-2.001-.021-.009-1.968-.753-1.986-2.551z"/>
    <path d="M12.373 3.768c.495-.597.829-1.427.737-2.254-.713.028-1.576.474-2.088 1.071-.458.531-.861 1.381-.753 2.196.795.061 1.609-.404 2.104-1.013z"/>
  </svg>
);

var OAUTH_PROVIDERS = [
  { id: "google",   label: "Sign up with Google",   icon: GOOGLE_ICON   },
  { id: "linkedin", label: "Sign up with LinkedIn",  icon: LINKEDIN_ICON },
  { id: "apple",    label: "Sign up with Apple",     icon: APPLE_ICON    }
];

var PW_CHECKS = [
  { key: "length"    as const, label: "8+ characters",   test: function(p: string) { return p.length >= 8; }      },
  { key: "uppercase" as const, label: "Uppercase letter", test: function(p: string) { return /[A-Z]/.test(p); }   },
  { key: "number"    as const, label: "One number",       test: function(p: string) { return /[0-9]/.test(p); }   }
];

export default function RegisterPage() {
  var router = useRouter();
  var { getToken } = useRecaptcha();
  var [showPw, setShowPw] = useState(false);

  var {
    register, handleSubmit, watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  var pw    = watch("password", "");
  var score = PW_CHECKS.filter(function(c) { return c.test(pw); }).length;

  var onSubmit = async function(data: RegisterFormData) {
    try {
      var recaptchaToken = await getToken("register");
      await authApi.register({
        name: data.name, email: data.email,
        password: data.password, inviteCode: data.inviteCode,
        recaptchaToken: recaptchaToken || undefined
      });
      toast.success("Account created — verify your email to continue.");
      router.push("/login?registered=1");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  function handleOAuth(provider: string) {
    window.location.href = authApi.getOAuthUrl(provider as "google" | "apple" | "linkedin");
  }

  return (
    <div className="auth-card">
      {/* Header */}
      <div className="mb-7">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-5"
          style={{ boxShadow: "0 0 28px rgba(99,102,241,0.45)" }}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="white" />
          </svg>
        </div>
        <p className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-1.5">Join the community</p>
        <h1 className="text-[1.6rem] font-black text-white leading-tight tracking-tight mb-1.5">
          Create your account
        </h1>
        <p className="text-sm text-slate-400">
          Already a member?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      {/* OAuth */}
      <div className="space-y-2.5 mb-6">
        {OAUTH_PROVIDERS.map(function(p) {
          return (
            <button key={p.id} type="button" className="oauth-btn"
              onClick={function() { handleOAuth(p.id); }}>
              {p.icon}<span>{p.label}</span>
            </button>
          );
        })}
      </div>

      <div className="divider mb-6">or register with email</div>

      {/* Form — logic untouched */}
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
              <button type="button" aria-label={showPw ? "Hide" : "Show"}
                onClick={function() { setShowPw(function(v) { return !v; }); }}
                className="text-slate-500 hover:text-slate-300 transition-colors">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
            error={errors.password?.message}
            autoComplete="new-password"
            required
            {...register("password")}
          />
          {pw.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-1 mb-1">
                {[0,1,2].map(function(i) {
                  return (
                    <div key={i} className={"h-0.5 flex-1 rounded-full transition-all duration-300 " +
                      (i < score
                        ? score === 1 ? "bg-red-400" : score === 2 ? "bg-amber-400" : "bg-emerald-500"
                        : "bg-white/10")} />
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {PW_CHECKS.map(function(c) {
                  var ok = c.test(pw);
                  return (
                    <div key={c.key} className="flex items-center gap-1">
                      {ok
                        ? <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />
                        : <XCircle      size={10} className="text-slate-600 shrink-0" />}
                      <span className={"text-[10px] font-medium " + (ok ? "text-emerald-400" : "text-slate-500")}>{c.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Button type="submit" fullWidth size="lg" loading={isSubmitting} className="mt-1">
          Create account
        </Button>

        <p className="text-center text-xs text-slate-600 leading-relaxed pt-1">
          By continuing you agree to our{" "}
          <span className="text-slate-500 underline underline-offset-2 cursor-pointer hover:text-slate-400 transition-colors">Terms</span>
          {" and "}
          <span className="text-slate-500 underline underline-offset-2 cursor-pointer hover:text-slate-400 transition-colors">Privacy Policy</span>.
        </p>
      </form>
    </div>
  );
}