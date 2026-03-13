"use client";

import React, { useState, useEffect } from "react";
import {
  User, Lock, Bell, Trash2, Shield,
  Globe, MapPin, Twitter, Linkedin, Github,
  Tag, CheckCircle2, Eye, EyeOff,
  AlertTriangle, Save, Loader2, X,
  Check, QrCode, Copy, ShieldCheck, Settings, Sparkles
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { profileApi }   from "@/lib/api/profile.api";
import { authApi }      from "@/lib/api/auth.api";
import { getErrorMessage } from "@/lib/api/client";
import { useAuthStore }  from "@/lib/store/auth.store";
import { AvatarUpload }  from "@/components/profile/AvatarUpload";
import { Input }         from "@/components/ui/Input";
import { Button }        from "@/components/ui/Button";
import toast from "react-hot-toast";

type BackendProfile = {
  _id: string; userId: string; avatar: string | null; bio: string;
  location: string; website: string; skills: string[]; interests: string[];
  reputation: number; tier: string; completionPercentage: number;
  socialLinks: { twitter?: string; linkedin?: string; github?: string };
};

type Tab = "profile" | "security" | "notifications" | "account";

var profileSchema = z.object({
  bio:      z.string().max(300, "Max 300 characters").optional().or(z.literal("")),
  location: z.string().max(100, "Max 100 characters").optional().or(z.literal("")),
  website:  z.string().url("Enter a valid URL").optional().or(z.literal("")),
  twitter:  z.string().optional().or(z.literal("")),
  linkedin: z.string().optional().or(z.literal("")),
  github:   z.string().optional().or(z.literal(""))
});
type ProfileFormData = z.infer<typeof profileSchema>;

var passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword:     z.string().min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Needs uppercase").regex(/[0-9]/, "Needs a number"),
  confirmPassword: z.string().min(1, "Required")
}).refine(function(d) { return d.newPassword === d.confirmPassword; }, {
  message: "Passwords do not match", path: ["confirmPassword"]
});
type PasswordFormData = z.infer<typeof passwordSchema>;

var twoFactorConfirmSchema = z.object({
  code: z.string().length(6, "Code must be exactly 6 digits").regex(/^\d+$/, "Digits only")
});
type TwoFactorConfirmData = z.infer<typeof twoFactorConfirmSchema>;

var twoFactorDisableSchema = z.object({
  code: z.string().length(6, "Code must be exactly 6 digits").regex(/^\d+$/, "Digits only")
});
type TwoFactorDisableData = z.infer<typeof twoFactorDisableSchema>;

var SKILL_SUGGESTIONS = [
  "JavaScript","TypeScript","React","Next.js","Node.js","Python",
  "Go","Product Design","UX Research","Data Science","Machine Learning","DevOps"
];
var INTEREST_OPTIONS = [
  "Building Products","Open Source","Design Systems","AI & ML","Web3",
  "Climate Tech","Developer Tools","Community Building","Startups","Research","Mentorship","Writing"
];

var TABS: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "profile",       label: "Profile",       icon: <User size={15} />,   desc: "Public info" },
  { id: "security",      label: "Security",      icon: <Lock size={15} />,   desc: "Password & 2FA" },
  { id: "notifications", label: "Notifications", icon: <Bell size={15} />,   desc: "Alert settings" },
  { id: "account",       label: "Account",       icon: <Shield size={15} />, desc: "Danger zone" }
];

var PW_RULES = [
  { label: "8+ characters",    test: function(p: string) { return p.length >= 8; }   },
  { label: "Uppercase letter", test: function(p: string) { return /[A-Z]/.test(p); } },
  { label: "One number",       test: function(p: string) { return /[0-9]/.test(p); } }
];

type TwoFAStep = "idle" | "setup_loading" | "confirm" | "recovery" | "disable";

export default function SettingsPage() {
  var { user, updateUser } = useAuthStore();
  var [activeTab, setActiveTab] = useState<Tab>("profile");
  var [profile, setProfile]     = useState<BackendProfile | null>(null);
  var [loading, setLoading]     = useState(true);
  var [skills, setSkills]       = useState<string[]>([]);
  var [interests, setInterests] = useState<string[]>([]);
  var [skillInput, setSkillInput] = useState("");
  var [savingProfile, setSavingProfile] = useState(false);

  var [twoFaStep,     setTwoFaStep]     = useState<TwoFAStep>("idle");
  var [twoFaQrUrl,    setTwoFaQrUrl]    = useState("");
  var [twoFaSecret,   setTwoFaSecret]   = useState("");
  var [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  var [twoFaEnabled,  setTwoFaEnabled]  = useState(false);

  var profileForm      = useForm<ProfileFormData>({ resolver: zodResolver(profileSchema) });
  var passwordForm     = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });
  var twoFaConfirmForm = useForm<TwoFactorConfirmData>({ resolver: zodResolver(twoFactorConfirmSchema) });
  var twoFaDisableForm = useForm<TwoFactorDisableData>({ resolver: zodResolver(twoFactorDisableSchema) });

  var pwVal   = passwordForm.watch("newPassword", "");
  var pwScore = PW_RULES.filter(function(r) { return r.test(pwVal); }).length;
  var [showCurPw,  setShowCurPw]  = useState(false);
  var [showNewPw,  setShowNewPw]  = useState(false);
  var [showConfPw, setShowConfPw] = useState(false);

  useEffect(function() {
    profileApi.getMyProfile()
      .then(function(res) {
        var body = res.data as unknown as { data: { profile: BackendProfile } };
        var p = body.data.profile;
        setProfile(p);
        setSkills(p.skills || []);
        setInterests(p.interests || []);
        profileForm.reset({
          bio:      p.bio || "",
          location: p.location || "",
          website:  p.website || "",
          twitter:  p.socialLinks?.twitter || "",
          linkedin: p.socialLinks?.linkedin || "",
          github:   p.socialLinks?.github || ""
        });
      })
      .catch(function(err) { toast.error(getErrorMessage(err)); })
      .finally(function() { setLoading(false); });
  }, []);

  useEffect(function() {
    if (user) setTwoFaEnabled(!!user.twoFactorEnabled);
  }, [user]);

  async function handleSaveProfile(data: ProfileFormData) {
    setSavingProfile(true);
    try {
      await profileApi.updateProfile({
        bio:       data.bio      || undefined,
        location:  data.location || undefined,
        website:   data.website  || undefined,
        skills,
        interests,
        socialLinks: {
          twitter:  data.twitter  || undefined,
          linkedin: data.linkedin || undefined,
          github:   data.github   || undefined
        }
      });
      toast.success("Profile updated!");
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setSavingProfile(false); }
  }

  async function handleChangePassword(data: PasswordFormData) {
    try {
      await authApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success("Password updated successfully!");
      passwordForm.reset();
    } catch(err) { toast.error(getErrorMessage(err)); }
  }

  async function handle2FASetup() {
    setTwoFaStep("setup_loading");
    try {
      var res  = await authApi.setup2FA();
      var data = (res.data as unknown as { data: { qrCodeUrl: string; secret: string } }).data;
      setTwoFaQrUrl(data.qrCodeUrl);
      setTwoFaSecret(data.secret);
      setTwoFaStep("confirm");
    } catch(err) { toast.error(getErrorMessage(err)); setTwoFaStep("idle"); }
  }

  async function handle2FAConfirm(data: TwoFactorConfirmData) {
    try {
      var res    = await authApi.confirm2FA(data.code);
      var result = (res.data as unknown as { data: { recoveryCodes: string[] } }).data;
      setRecoveryCodes(result.recoveryCodes || []);
      setTwoFaEnabled(true);
      updateUser({ twoFactorEnabled: true });
      setTwoFaStep("recovery");
      twoFaConfirmForm.reset();
      toast.success("Two-factor authentication enabled!");
    } catch(err) { toast.error(getErrorMessage(err)); }
  }

  async function handle2FADisable(data: TwoFactorDisableData) {
    try {
      await authApi.disable2FA(data.code);
      setTwoFaEnabled(false);
      updateUser({ twoFactorEnabled: false });
      setTwoFaStep("idle");
      twoFaDisableForm.reset();
      toast.success("2FA disabled.");
    } catch(err) { toast.error(getErrorMessage(err)); }
  }

  function copySecret() {
    navigator.clipboard.writeText(twoFaSecret).then(function() { toast.success("Secret copied!"); });
  }

  function copyRecoveryCodes() {
    navigator.clipboard.writeText(recoveryCodes.join("\n")).then(function() { toast.success("Recovery codes copied!"); });
  }

  function addSkill(v: string) {
    var t = v.trim();
    if (!t || skills.includes(t) || skills.length >= 15) { setSkillInput(""); return; }
    setSkills(function(prev) { return [...prev, t]; });
    setSkillInput("");
  }

  function toggleInterest(i: string) {
    if (interests.includes(i)) {
      setInterests(function(prev) { return prev.filter(function(x) { return x !== i; }); });
    } else if (interests.length < 10) {
      setInterests(function(prev) { return [...prev, i]; });
    } else { toast.error("Maximum 10 interests"); }
  }

  var activeTabMeta = TABS.find(function(t) { return t.id === activeTab; }) || TABS[0];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center"
          style={{ boxShadow: "0 0 20px rgba(99,102,241,0.15)" }}>
          <Loader2 size={20} className="animate-spin text-brand-500" />
        </div>
        <p className="text-sm text-surface-400 font-medium">Loading settings...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#f0f2ff 0%,#f8fafc 280px)" }}>
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl mb-8 px-7 py-6"
          style={{ background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)", boxShadow: "0 6px 24px rgba(99,102,241,0.3)" }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='0.8' fill='white'/%3E%3C/svg%3E\")" }} />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shrink-0">
              <Settings size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={12} className="text-purple-200" />
                <span className="text-xs font-bold text-purple-200 uppercase tracking-widest">Account</span>
              </div>
              <h1 className="text-xl font-black text-white tracking-tight">Settings</h1>
              <p className="text-sm text-indigo-200 font-medium">Manage your profile, security, and preferences.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <div className="lg:w-56 shrink-0">
            <div className="bg-white border border-surface-200 rounded-2xl p-2 lg:sticky lg:top-6"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              {TABS.map(function(tab) {
                var active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={function() { setActiveTab(tab.id); }}
                    className={[
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 text-left mb-0.5 last:mb-0",
                      active
                        ? "bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-200"
                        : "hover:bg-surface-50 border border-transparent"
                    ].join(" ")}>
                    <div className={["w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all",
                      active ? "bg-brand-600 shadow-sm" : "bg-surface-100"
                    ].join(" ")}>
                      <span className={active ? "text-white" : "text-surface-500"}>{tab.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className={["text-sm font-bold leading-tight", active ? "text-brand-700" : "text-surface-700"].join(" ")}>
                        {tab.label}
                      </p>
                      <p className="text-[10px] text-surface-400 font-medium mt-0.5">{tab.desc}</p>
                    </div>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Section label */}
            <div className="flex items-center gap-2 px-1">
              <span className="text-brand-600">{activeTabMeta.icon}</span>
              <span className="text-xs font-black text-surface-500 uppercase tracking-widest">{activeTabMeta.label}</span>
            </div>

            {/* ── PROFILE TAB ── */}
            {activeTab === "profile" && (
              <>
                {/* Avatar */}
                <div className="bg-white border border-surface-200 rounded-2xl p-6"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <h2 className="text-xs font-black text-surface-500 uppercase tracking-widest mb-5">Profile photo</h2>
                  <div className="flex items-center gap-5">
                    {user && (
                      <AvatarUpload
                        name={user.name}
                        currentAvatarUrl={profile?.avatar || undefined}
                        size={72}
                        onUploadComplete={function(url) {
                          setProfile(function(prev) { return prev ? Object.assign({}, prev, { avatar: url }) : prev; });
                        }}
                      />
                    )}
                    <div>
                      <p className="text-sm font-black text-surface-900 mb-0.5">{user?.name}</p>
                      <p className="text-xs text-surface-500 mb-3">{user?.email}</p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-500 font-medium">
                        Click avatar to upload · JPG, PNG, WebP · max 5MB
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile info */}
                <div className="bg-white border border-surface-200 rounded-2xl p-6"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <h2 className="text-xs font-black text-surface-500 uppercase tracking-widest mb-5">Profile information</h2>
                  <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-5">
                    <div>
                      <label className="label">Bio</label>
                      <textarea {...profileForm.register("bio")} rows={3}
                        placeholder="Tell the community about yourself..."
                        className="input resize-none w-full" />
                      {profileForm.formState.errors.bio && (
                        <p className="field-error">{profileForm.formState.errors.bio.message}</p>
                      )}
                      <p className="field-hint">Max 300 characters. Shown publicly on your profile.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Location" placeholder="e.g. San Francisco, CA"
                        leftIcon={<MapPin size={14} />}
                        error={profileForm.formState.errors.location?.message}
                        {...profileForm.register("location")} />
                      <Input label="Website" type="url" placeholder="https://yoursite.com"
                        leftIcon={<Globe size={14} />}
                        error={profileForm.formState.errors.website?.message}
                        {...profileForm.register("website")} />
                    </div>
                    <div>
                      <p className="label">Social links</p>
                      <div className="space-y-2.5">
                        <Input placeholder="https://twitter.com/username" leftIcon={<Twitter size={14} />}
                          {...profileForm.register("twitter")} />
                        <Input placeholder="https://linkedin.com/in/username" leftIcon={<Linkedin size={14} />}
                          {...profileForm.register("linkedin")} />
                        <Input placeholder="https://github.com/username" leftIcon={<Github size={14} />}
                          {...profileForm.register("github")} />
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <Button type="submit" loading={savingProfile} leftIcon={<Save size={13} />}>
                        Save changes
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Skills */}
                <div className="bg-white border border-surface-200 rounded-2xl p-6"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xs font-black text-surface-500 uppercase tracking-widest">Skills</h2>
                    <span className="text-[10px] font-bold text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">{skills.length}/15</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input placeholder="Type a skill and press Enter" leftIcon={<Tag size={14} />}
                        value={skillInput}
                        onChange={function(e) { setSkillInput(e.target.value); }}
                        onKeyDown={function(e) { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
                        className="flex-1" />
                      <Button type="button" variant="secondary" onClick={function() { addSkill(skillInput); }}>Add</Button>
                    </div>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {skills.map(function(s) {
                          return (
                            <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                              style={{ background: "rgba(238,242,255,0.9)", color: "#4338ca", border: "1px solid rgba(199,210,254,0.8)" }}>
                              {s}
                              <button type="button"
                                onClick={function() { setSkills(function(prev) { return prev.filter(function(x) { return x !== s; }); }); }}
                                className="hover:text-red-500 transition-colors ml-0.5">
                                <X size={10} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2.5">Quick add</p>
                      <div className="flex flex-wrap gap-2">
                        {SKILL_SUGGESTIONS.filter(function(s) { return !skills.includes(s); }).map(function(s) {
                          return (
                            <button key={s} type="button" onClick={function() { addSkill(s); }}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-100 text-surface-600 border border-surface-200 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all duration-150">
                              + {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <Button type="button" loading={savingProfile}
                        onClick={profileForm.handleSubmit(handleSaveProfile)} leftIcon={<Save size={13} />}>
                        Save skills
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Interests */}
                <div className="bg-white border border-surface-200 rounded-2xl p-6"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xs font-black text-surface-500 uppercase tracking-widest">Interests</h2>
                    <span className="text-[10px] font-bold text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">{interests.length}/10</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {INTEREST_OPTIONS.map(function(interest) {
                      var selected = interests.includes(interest);
                      return (
                        <button key={interest} type="button" onClick={function() { toggleInterest(interest); }}
                          className={[
                            "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 border",
                            selected
                              ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                              : "bg-white text-surface-600 border-surface-200 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50"
                          ].join(" ")}>
                          {selected && <Check size={10} />}
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" loading={savingProfile}
                      onClick={profileForm.handleSubmit(handleSaveProfile)} leftIcon={<Save size={13} />}>
                      Save interests
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === "security" && (
              <>
                <div className="bg-white border border-surface-200 rounded-2xl p-6"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <h2 className="text-xs font-black text-surface-500 uppercase tracking-widest mb-1.5">Change password</h2>
                  <p className="text-xs text-surface-500 mb-6 leading-relaxed">Use a strong password with at least 8 characters, a number, and an uppercase letter.</p>
                  <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                    <Input label="Current password" type={showCurPw ? "text" : "password"}
                      placeholder="Your current password" leftIcon={<Lock size={14} />}
                      error={passwordForm.formState.errors.currentPassword?.message}
                      rightElement={
                        <button type="button" onClick={function() { setShowCurPw(function(v) { return !v; }); }}
                          className="text-surface-400 hover:text-surface-600 transition-colors">
                          {showCurPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      }
                      {...passwordForm.register("currentPassword")} />
                    <div>
                      <Input label="New password" type={showNewPw ? "text" : "password"}
                        placeholder="New password" leftIcon={<Lock size={14} />}
                        error={passwordForm.formState.errors.newPassword?.message}
                        rightElement={
                          <button type="button" onClick={function() { setShowNewPw(function(v) { return !v; }); }}
                            className="text-surface-400 hover:text-surface-600 transition-colors">
                            {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        }
                        {...passwordForm.register("newPassword")} />
                      {pwVal.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="flex gap-1.5">
                            {[0,1,2].map(function(i) {
                              return <div key={i} className={"h-1 flex-1 rounded-full transition-all duration-300 " +
                                (i < pwScore ? (pwScore === 1 ? "bg-red-400" : pwScore === 2 ? "bg-amber-400" : "bg-emerald-500") : "bg-surface-200")} />;
                            })}
                          </div>
                          <div className="flex gap-4">
                            {PW_RULES.map(function(rule) {
                              var ok = rule.test(pwVal);
                              return (
                                <div key={rule.label} className="flex items-center gap-1">
                                  {ok ? <CheckCircle2 size={10} className="text-emerald-500" /> : <X size={10} className="text-surface-300" />}
                                  <span className={"text-[10px] font-semibold " + (ok ? "text-emerald-600" : "text-surface-400")}>{rule.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <Input label="Confirm new password" type={showConfPw ? "text" : "password"}
                      placeholder="Repeat new password" leftIcon={<Lock size={14} />}
                      error={passwordForm.formState.errors.confirmPassword?.message}
                      rightElement={
                        <button type="button" onClick={function() { setShowConfPw(function(v) { return !v; }); }}
                          className="text-surface-400 hover:text-surface-600 transition-colors">
                          {showConfPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      }
                      {...passwordForm.register("confirmPassword")} />
                    <div className="pt-2 flex justify-end">
                      <Button type="submit" loading={passwordForm.formState.isSubmitting}>Update password</Button>
                    </div>
                  </form>
                </div>

                {/* 2FA */}
                <div className="bg-white border border-surface-200 rounded-2xl p-6"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2 className="text-xs font-black text-surface-500 uppercase tracking-widest mb-2">Two-factor authentication</h2>
                      <p className="text-sm font-bold text-surface-900 mb-1">
                        {twoFaEnabled ? "2FA is active" : "Add an extra layer of security"}
                      </p>
                      <p className="text-xs text-surface-500 leading-relaxed max-w-sm">
                        {twoFaEnabled
                          ? "Your account is protected with a time-based authenticator code."
                          : "Require a one-time code from your authenticator app on every sign-in."}
                      </p>
                    </div>
                    <span className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ml-4 border " +
                      (twoFaEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-surface-100 text-surface-500 border-surface-200")}>
                      {twoFaEnabled ? <ShieldCheck size={11} /> : <Shield size={11} />}
                      {twoFaEnabled ? "Enabled" : "Not enabled"}
                    </span>
                  </div>

                  {twoFaStep === "idle" && (
                    twoFaEnabled
                      ? <Button variant="danger" leftIcon={<Shield size={13} />} onClick={function() { setTwoFaStep("disable"); }}>Disable 2FA</Button>
                      : <Button variant="secondary" leftIcon={<QrCode size={13} />} onClick={handle2FASetup}>Enable 2FA</Button>
                  )}

                  {twoFaStep === "setup_loading" && (
                    <div className="flex items-center gap-2 text-sm text-surface-500 py-2">
                      <Loader2 size={14} className="animate-spin text-brand-500" />Generating your QR code...
                    </div>
                  )}

                  {twoFaStep === "confirm" && (
                    <div className="mt-2 space-y-4">
                      <div className="p-5 rounded-2xl border border-surface-200 bg-surface-50">
                        <p className="text-xs font-black text-surface-700 uppercase tracking-widest mb-4">Step 1 — Scan QR code</p>
                        {twoFaQrUrl && (
                          <div className="flex justify-center mb-4">
                            <div className="p-3 bg-white rounded-2xl border border-surface-200 shadow-sm">
                              <img src={twoFaQrUrl} alt="2FA QR code" className="w-36 h-36" />
                            </div>
                          </div>
                        )}
                        {twoFaSecret && (
                          <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-surface-200">
                            <p className="text-[11px] font-mono text-surface-600 flex-1 truncate">{twoFaSecret}</p>
                            <button type="button" onClick={copySecret}
                              className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 shrink-0">
                              <Copy size={11} />Copy
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="p-5 rounded-2xl border border-surface-200 bg-surface-50">
                        <p className="text-xs font-black text-surface-700 uppercase tracking-widest mb-4">Step 2 — Enter 6-digit code</p>
                        <form onSubmit={twoFaConfirmForm.handleSubmit(handle2FAConfirm)} className="flex gap-2">
                          <Input placeholder="000000" maxLength={6}
                            className="flex-1 text-center text-lg font-mono tracking-[0.3em]"
                            error={twoFaConfirmForm.formState.errors.code?.message}
                            {...twoFaConfirmForm.register("code")} />
                          <Button type="submit" loading={twoFaConfirmForm.formState.isSubmitting} leftIcon={<ShieldCheck size={13} />}>
                            Verify & Enable
                          </Button>
                        </form>
                      </div>
                      <button type="button" onClick={function() { setTwoFaStep("idle"); twoFaConfirmForm.reset(); }}
                        className="text-xs text-surface-400 hover:text-surface-600 transition-colors font-medium">
                        Cancel setup
                      </button>
                    </div>
                  )}

                  {twoFaStep === "recovery" && (
                    <div className="mt-2 space-y-4">
                      <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                        <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs font-semibold text-amber-700 leading-relaxed">
                          Save these recovery codes — they will not be shown again. Each code can only be used once.
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200">
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {recoveryCodes.map(function(code) {
                            return (
                              <span key={code} className="text-xs font-mono text-surface-700 bg-white px-3 py-2 rounded-xl border border-surface-200 text-center">
                                {code}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex justify-end">
                          <button type="button" onClick={copyRecoveryCodes}
                            className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors">
                            <Copy size={11} />Copy all codes
                          </button>
                        </div>
                      </div>
                      <Button onClick={function() { setTwoFaStep("idle"); }} leftIcon={<Check size={13} />}>
                        Done — I have saved my codes
                      </Button>
                    </div>
                  )}

                  {twoFaStep === "disable" && (
                    <div className="mt-2 space-y-4">
                      <p className="text-sm text-surface-600 leading-relaxed">
                        Enter the 6-digit code from your authenticator app to confirm disabling 2FA.
                      </p>
                      <form onSubmit={twoFaDisableForm.handleSubmit(handle2FADisable)} className="flex gap-2">
                        <Input placeholder="000000" maxLength={6}
                          className="flex-1 text-center text-lg font-mono tracking-[0.3em]"
                          error={twoFaDisableForm.formState.errors.code?.message}
                          {...twoFaDisableForm.register("code")} />
                        <Button type="submit" variant="danger" loading={twoFaDisableForm.formState.isSubmitting}>Disable</Button>
                      </form>
                      <button type="button" onClick={function() { setTwoFaStep("idle"); twoFaDisableForm.reset(); }}
                        className="text-xs text-surface-400 hover:text-surface-600 transition-colors font-medium">Cancel</button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === "notifications" && (
              <div className="bg-white border border-surface-200 rounded-2xl p-6"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <h2 className="text-xs font-black text-surface-500 uppercase tracking-widest mb-6">Notification preferences</h2>
                <div className="space-y-1">
                  {[
                    { label: "New replies to your posts",   sub: "When someone replies to a post you created",      defaultOn: true  },
                    { label: "Mentions",                    sub: "When someone @mentions you in a post or comment", defaultOn: true  },
                    { label: "Community announcements",     sub: "Important updates from your communities",         defaultOn: true  },
                    { label: "Event reminders",             sub: "Reminders before events you RSVP'd to",          defaultOn: true  },
                    { label: "New followers",               sub: "When someone follows your profile",               defaultOn: false },
                    { label: "Weekly digest",               sub: "A weekly summary of activity in your communities",defaultOn: false }
                  ].map(function(item, i) {
                    return (
                      <div key={i} className="flex items-center justify-between py-4 border-b border-surface-100 last:border-0 group">
                        <div>
                          <p className="text-sm font-bold text-surface-900">{item.label}</p>
                          <p className="text-xs text-surface-500 mt-0.5 leading-relaxed">{item.sub}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-6 shrink-0">
                          <input type="checkbox" className="sr-only peer" defaultChecked={item.defaultOn} />
                          <div className="w-10 h-6 bg-surface-200 rounded-full peer peer-checked:bg-brand-600 transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:after:translate-x-4" />
                        </label>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={function() { toast.success("Preferences saved!"); }} leftIcon={<Save size={13} />}>
                    Save preferences
                  </Button>
                </div>
              </div>
            )}

            {/* ── ACCOUNT TAB ── */}
            {activeTab === "account" && (
              <>
                <div className="bg-white border border-surface-200 rounded-2xl p-6"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <h2 className="text-xs font-black text-surface-500 uppercase tracking-widest mb-5">Account information</h2>
                  <div className="divide-y divide-surface-100">
                    {[
                      { label: "Name",      value: user?.name  || "—" },
                      { label: "Email",     value: user?.email || "—" },
                      { label: "Role",      value: user?.role  || "member" },
                      { label: "Member ID", value: user?._id   || "—" }
                    ].map(function(row) {
                      return (
                        <div key={row.label} className="flex items-center justify-between py-3.5">
                          <span className="text-xs font-black text-surface-400 uppercase tracking-widest">{row.label}</span>
                          <span className="text-sm text-surface-900 font-semibold font-mono">{row.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-red-200 rounded-2xl p-6"
                  style={{ boxShadow: "0 2px 12px rgba(239,68,68,0.06)" }}>
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                      <AlertTriangle size={16} className="text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-red-700 mb-1.5">Danger zone</h2>
                      <p className="text-xs text-surface-500 leading-relaxed">
                        Deleting your account is permanent. All your posts, comments, and community memberships will be removed immediately and cannot be recovered.
                      </p>
                    </div>
                  </div>
                  <Button variant="danger" leftIcon={<Trash2 size={13} />}
                    onClick={function() { toast.error("Please contact support to delete your account."); }}>
                    Delete account
                  </Button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
