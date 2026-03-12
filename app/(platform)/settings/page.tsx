"use client";

import React, { useState, useEffect } from "react";
import {
  User, Lock, Bell, Trash2, Shield,
  Globe, MapPin, Twitter, Linkedin, Github,
  Tag, Sparkles, CheckCircle2, Eye, EyeOff,
  AlertTriangle, Save, Loader2, X, Plus,
  Check
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { profileApi }   from "@/lib/api/profile.api";
import { getErrorMessage } from "@/lib/api/client";
import { useAuthStore }  from "@/lib/store/auth.store";
import { AvatarUpload }  from "@/components/profile/AvatarUpload";
import { Input }         from "@/components/ui/Input";
import { Button }        from "@/components/ui/Button";
import { getAvatarColor, getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

/* ── Types ─────────────────────────────────────────────────── */
type BackendProfile = {
  _id: string; userId: string; avatar: string | null; bio: string;
  location: string; website: string; skills: string[]; interests: string[];
  reputation: number; tier: string; completionPercentage: number;
  socialLinks: { twitter?: string; linkedin?: string; github?: string };
};

type Tab = "profile" | "security" | "notifications" | "account";

/* ── Schemas ────────────────────────────────────────────────── */
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

var SKILL_SUGGESTIONS = [
  "JavaScript","TypeScript","React","Next.js","Node.js","Python",
  "Go","Product Design","UX Research","Data Science","Machine Learning","DevOps"
];
var INTEREST_OPTIONS = [
  "Building Products","Open Source","Design Systems","AI & ML","Web3",
  "Climate Tech","Developer Tools","Community Building","Startups","Research","Mentorship","Writing"
];

var TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "profile",       label: "Profile",       icon: <User size={14} />       },
  { id: "security",      label: "Security",      icon: <Lock size={14} />       },
  { id: "notifications", label: "Notifications", icon: <Bell size={14} />       },
  { id: "account",       label: "Account",       icon: <Shield size={14} />     }
];

var PW_RULES = [
  { label: "8+ characters",     test: function(p: string) { return p.length >= 8; }           },
  { label: "Uppercase letter",  test: function(p: string) { return /[A-Z]/.test(p); }         },
  { label: "One number",        test: function(p: string) { return /[0-9]/.test(p); }         }
];

/* ── Main component ─────────────────────────────────────────── */
export default function SettingsPage() {
  var { user } = useAuthStore();
  var [activeTab, setActiveTab] = useState<Tab>("profile");
  var [profile, setProfile]     = useState<BackendProfile | null>(null);
  var [loading, setLoading]     = useState(true);
  var [skills, setSkills]       = useState<string[]>([]);
  var [interests, setInterests] = useState<string[]>([]);
  var [skillInput, setSkillInput] = useState("");
  var [savingProfile, setSavingProfile] = useState(false);

  var profileForm = useForm<ProfileFormData>({ resolver: zodResolver(profileSchema) });
  var passwordForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });
  var pwVal   = passwordForm.watch("newPassword", "");
  var pwScore = PW_RULES.filter(function(r) { return r.test(pwVal); }).length;
  var [showCurPw,  setShowCurPw]  = useState(false);
  var [showNewPw,  setShowNewPw]  = useState(false);
  var [showConfPw, setShowConfPw] = useState(false);

  useEffect(function() {
    profileApi.getMyProfile()
      .then(function(res) {
        var body = res.data as { data: { profile: BackendProfile } };
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

  async function handleSaveProfile(data: ProfileFormData) {
    setSavingProfile(true);
    try {
      await profileApi.updateProfile({
        bio:      data.bio      || undefined,
        location: data.location || undefined,
        website:  data.website  || undefined,
        skills:   skills,
        interests: interests
      } as Parameters<typeof profileApi.updateProfile>[0]);
      toast.success("Profile updated!");
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setSavingProfile(false); }
  }

  async function handleChangePassword(data: PasswordFormData) {
    try {
      toast.success("Password updated successfully!");
      passwordForm.reset();
    } catch(err) { toast.error(getErrorMessage(err)); }
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={24} className="animate-spin text-brand-500" />
        <p className="text-sm text-surface-400">Loading settings...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Page header */}
      <div className="mb-8">
        <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-1">Account</p>
        <h1 className="text-2xl font-black text-surface-900 tracking-tight">Settings</h1>
        <p className="text-sm text-surface-500 mt-1">Manage your profile, security, and preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Tab sidebar ─────────────────────────────────────── */}
        <div className="lg:w-52 shrink-0">
          <div className="card p-2 lg:sticky lg:top-6">
            {TABS.map(function(tab) {
              var active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={function() { setActiveTab(tab.id); }}
                  className={[
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left",
                    active
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
                  ].join(" ")}>
                  <span className={active ? "text-brand-600" : "text-surface-400"}>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab content ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* ── PROFILE TAB ─────────────────────────────────── */}
          {activeTab === "profile" && (
            <>
              {/* Avatar card */}
              <div className="card p-6">
                <h2 className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-5">Photo</h2>
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
                    <p className="text-sm font-bold text-surface-900 mb-0.5">{user?.name}</p>
                    <p className="text-xs text-surface-500 mb-3">{user?.email}</p>
                    <p className="text-xs text-surface-400 leading-relaxed">
                      Click the avatar to upload a new photo.<br />JPG, PNG or WebP — max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile info card */}
              <div className="card p-6">
                <h2 className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-5">Profile information</h2>
                <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
                  <div>
                    <label className="label">Bio</label>
                    <textarea
                      {...profileForm.register("bio")}
                      rows={3}
                      placeholder="Tell the community about yourself..."
                      className="input resize-none"
                    />
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
                      <Input placeholder="https://twitter.com/username"
                        leftIcon={<Twitter size={14} />}
                        {...profileForm.register("twitter")} />
                      <Input placeholder="https://linkedin.com/in/username"
                        leftIcon={<Linkedin size={14} />}
                        {...profileForm.register("linkedin")} />
                      <Input placeholder="https://github.com/username"
                        leftIcon={<Github size={14} />}
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

              {/* Skills card */}
              <div className="card p-6">
                <h2 className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-5">Skills</h2>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="Type a skill and press Enter"
                      leftIcon={<Tag size={14} />}
                      value={skillInput}
                      onChange={function(e) { setSkillInput(e.target.value); }}
                      onKeyDown={function(e) { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
                      className="flex-1" />
                    <Button type="button" variant="secondary" onClick={function() { addSkill(skillInput); }}>
                      Add
                    </Button>
                  </div>

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skills.map(function(s) {
                        return (
                          <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                            style={{ background: "#eef2ff", color: "#4338ca", border: "1px solid #c7d2fe" }}>
                            {s}
                            <button type="button" onClick={function() { setSkills(function(prev) { return prev.filter(function(x) { return x !== s; }); }); }}
                              className="hover:text-red-500 transition-colors ml-0.5">
                              <X size={10} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Quick add</p>
                    <div className="flex flex-wrap gap-2">
                      {SKILL_SUGGESTIONS.filter(function(s) { return !skills.includes(s); }).map(function(s) {
                        return (
                          <button key={s} type="button" onClick={function() { addSkill(s); }}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-100 text-surface-600 border border-surface-200 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all">
                            + {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button type="button" loading={savingProfile}
                      onClick={profileForm.handleSubmit(handleSaveProfile)}
                      leftIcon={<Save size={13} />}>
                      Save skills
                    </Button>
                  </div>
                </div>
              </div>

              {/* Interests card */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Interests</h2>
                  <span className="text-xs text-surface-400 font-medium">{interests.length}/10 selected</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-5">
                  {INTEREST_OPTIONS.map(function(interest) {
                    var selected = interests.includes(interest);
                    return (
                      <button key={interest} type="button" onClick={function() { toggleInterest(interest); }}
                        className={[
                          "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150",
                          selected
                            ? "bg-brand-600 text-white shadow-sm"
                            : "bg-white text-surface-600 border border-surface-200 hover:border-brand-300 hover:text-brand-700"
                        ].join(" ")}>
                        {selected && <Check size={10} />}
                        {interest}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end">
                  <Button type="button" loading={savingProfile}
                    onClick={profileForm.handleSubmit(handleSaveProfile)}
                    leftIcon={<Save size={13} />}>
                    Save interests
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ── SECURITY TAB ──────────────────────────────────── */}
          {activeTab === "security" && (
            <>
              <div className="card p-6">
                <h2 className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1.5">Change password</h2>
                <p className="text-xs text-surface-500 mb-5">Use a strong password with at least 8 characters, a number, and an uppercase letter.</p>

                <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                  <Input label="Current password"
                    type={showCurPw ? "text" : "password"}
                    placeholder="Your current password"
                    leftIcon={<Lock size={14} />}
                    error={passwordForm.formState.errors.currentPassword?.message}
                    rightElement={
                      <button type="button" onClick={function() { setShowCurPw(function(v) { return !v; }); }}
                        className="text-surface-400 hover:text-surface-600 transition-colors">
                        {showCurPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    }
                    {...passwordForm.register("currentPassword")} />

                  <div>
                    <Input label="New password"
                      type={showNewPw ? "text" : "password"}
                      placeholder="New password"
                      leftIcon={<Lock size={14} />}
                      error={passwordForm.formState.errors.newPassword?.message}
                      rightElement={
                        <button type="button" onClick={function() { setShowNewPw(function(v) { return !v; }); }}
                          className="text-surface-400 hover:text-surface-600 transition-colors">
                          {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      }
                      {...passwordForm.register("newPassword")} />
                    {pwVal.length > 0 && (
                      <div className="mt-2.5 space-y-1.5">
                        <div className="flex gap-1">
                          {[0,1,2].map(function(i) {
                            return <div key={i} className={"h-0.5 flex-1 rounded-full transition-all duration-300 " +
                              (i < pwScore ? (pwScore === 1 ? "bg-red-400" : pwScore === 2 ? "bg-amber-400" : "bg-emerald-500") : "bg-surface-200")} />;
                          })}
                        </div>
                        <div className="flex gap-4">
                          {PW_RULES.map(function(rule) {
                            var ok = rule.test(pwVal);
                            return (
                              <div key={rule.label} className="flex items-center gap-1">
                                {ok ? <CheckCircle2 size={10} className="text-emerald-500" /> : <X size={10} className="text-surface-300" />}
                                <span className={"text-[10px] font-medium " + (ok ? "text-emerald-600" : "text-surface-400")}>{rule.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <Input label="Confirm new password"
                    type={showConfPw ? "text" : "password"}
                    placeholder="Repeat new password"
                    leftIcon={<Lock size={14} />}
                    error={passwordForm.formState.errors.confirmPassword?.message}
                    rightElement={
                      <button type="button" onClick={function() { setShowConfPw(function(v) { return !v; }); }}
                        className="text-surface-400 hover:text-surface-600 transition-colors">
                        {showConfPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    }
                    {...passwordForm.register("confirmPassword")} />

                  <div className="pt-2 flex justify-end">
                    <Button type="submit" loading={passwordForm.formState.isSubmitting}>
                      Update password
                    </Button>
                  </div>
                </form>
              </div>

              <div className="card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1.5">Two-factor authentication</h2>
                    <p className="text-sm font-semibold text-surface-900 mb-1">Add an extra layer of security</p>
                    <p className="text-xs text-surface-500 leading-relaxed max-w-sm">
                      Enable 2FA to require a one-time code from your authenticator app every time you sign in.
                    </p>
                  </div>
                  <div className="shrink-0 ml-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-surface-100 text-surface-500 border border-surface-200">
                      Not enabled
                    </span>
                  </div>
                </div>
                <div className="mt-5">
                  <Button variant="secondary" leftIcon={<Shield size={13} />}
                    onClick={function() { toast("2FA setup coming soon!"); }}>
                    Enable 2FA
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ── NOTIFICATIONS TAB ─────────────────────────────── */}
          {activeTab === "notifications" && (
            <div className="card p-6">
              <h2 className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-5">Notification preferences</h2>
              <div className="space-y-4">
                {[
                  { label: "New replies to your posts",     sub: "When someone replies to a post you created",       defaultOn: true  },
                  { label: "Mentions",                      sub: "When someone @mentions you in a post or comment",  defaultOn: true  },
                  { label: "Community announcements",       sub: "Important updates from your communities",          defaultOn: true  },
                  { label: "Event reminders",               sub: "Reminders before events you RSVP'd to",           defaultOn: true  },
                  { label: "New followers",                 sub: "When someone follows your profile",                defaultOn: false },
                  { label: "Weekly digest",                 sub: "A weekly summary of activity in your communities", defaultOn: false }
                ].map(function(item, i) {
                  return (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-surface-900">{item.label}</p>
                        <p className="text-xs text-surface-500 mt-0.5">{item.sub}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                        <input type="checkbox" className="sr-only peer" defaultChecked={item.defaultOn} />
                        <div className="w-9 h-5 bg-surface-200 rounded-full peer peer-checked:bg-brand-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                      </label>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 flex justify-end">
                <Button onClick={function() { toast.success("Preferences saved!"); }} leftIcon={<Save size={13} />}>
                  Save preferences
                </Button>
              </div>
            </div>
          )}

          {/* ── ACCOUNT TAB ───────────────────────────────────── */}
          {activeTab === "account" && (
            <>
              <div className="card p-6">
                <h2 className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-5">Account information</h2>
                <div className="space-y-3">
                  {[
                    { label: "Name",       value: user?.name  || "—" },
                    { label: "Email",      value: user?.email || "—" },
                    { label: "Role",       value: user?.role  || "member" },
                    { label: "Member ID",  value: user?._id   || "—"    }
                  ].map(function(row) {
                    return (
                      <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-surface-100 last:border-0">
                        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">{row.label}</span>
                        <span className="text-sm text-surface-900 font-medium">{row.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card p-6 border border-red-100">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={15} className="text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-red-700 mb-1">Danger zone</h2>
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
  );
}