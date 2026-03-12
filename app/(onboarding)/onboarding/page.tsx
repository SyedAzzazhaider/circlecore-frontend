"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight, ArrowLeft, CheckCircle2,
  Sparkles, Loader2, Tag, User, Globe,
  MapPin, X, Check, Zap
} from "lucide-react";
import { Button }   from "@/components/ui/Button";
import { Input }    from "@/components/ui/Input";
import { profileApi, type RecommendedContent } from "@/lib/api/profile.api";
import { getErrorMessage } from "@/lib/api/client";
import { onboardingStep1Schema, type OnboardingStep1Data } from "@/lib/validations/profile";
import toast from "react-hot-toast";
import Link from "next/link";

var SKILL_SUGGESTIONS = [
  "JavaScript","TypeScript","React","Next.js","Node.js","Python",
  "Go","Product Design","UX Research","Data Science",
  "Machine Learning","DevOps","AWS","Startup Ops","Growth"
];

var INTEREST_OPTIONS = [
  "Building Products","Open Source","Design Systems","AI & ML",
  "Web3","Climate Tech","Developer Tools","Community Building",
  "Startups","Research","Mentorship","Writing","Speaking"
];

var STEPS = [
  { id: 1, label: "About",     title: "Tell us about yourself",  desc: "Help the community get to know you"      },
  { id: 2, label: "Skills",    title: "Showcase your skills",    desc: "What expertise do you bring?"            },
  { id: 3, label: "Interests", title: "Pick your interests",     desc: "What topics are you most passionate about?" },
  { id: 4, label: "Done",      title: "You are all set!",        desc: "Here is what we picked for you"          }
];

export default function OnboardingPage() {
  var router = useRouter();
  var [step, setStep]                   = useState(1);
  var [isSubmitting, setIsSubmitting]   = useState(false);
  var [step1Data, setStep1Data]         = useState<OnboardingStep1Data>({ bio: "" });
  var [skills, setSkills]               = useState<string[]>([]);
  var [skillInput, setSkillInput]       = useState("");
  var [interests, setInterests]         = useState<string[]>([]);
  var [skillError, setSkillError]       = useState("");
  var [interestError, setInterestError] = useState("");
  var [recommended, setRecommended]     = useState<RecommendedContent[]>([]);
  var [loadingRecs, setLoadingRecs]     = useState(false);

  var step1Form = useForm<OnboardingStep1Data>({
    resolver: zodResolver(onboardingStep1Schema),
    defaultValues: step1Data
  });

  function addSkill(value: string) {
    var t = value.trim();
    if (!t) return;
    if (skills.length >= 15) { setSkillError("Maximum 15 skills"); return; }
    if (skills.includes(t)) { setSkillInput(""); return; }
    setSkills(function(prev) { return [...prev, t]; });
    setSkillInput(""); setSkillError("");
  }
  function removeSkill(s: string) { setSkills(function(prev) { return prev.filter(function(x) { return x !== s; }); }); }

  function toggleInterest(interest: string) {
    if (interests.includes(interest)) {
      setInterests(function(prev) { return prev.filter(function(i) { return i !== interest; }); });
    } else {
      if (interests.length >= 10) { setInterestError("Maximum 10 interests"); return; }
      setInterests(function(prev) { return [...prev, interest]; });
      setInterestError("");
    }
  }

  function handleStep1Next(data: OnboardingStep1Data) { setStep1Data(data); setStep(2); }

  function handleStep2Next() {
    if (skills.length === 0) { setSkillError("Add at least one skill"); return; }
    setSkillError(""); setStep(3);
  }

  async function handleStep3Next() {
    if (interests.length === 0) { setInterestError("Select at least one interest"); return; }
    setIsSubmitting(true);
    try {
      await profileApi.completeOnboarding({ bio: step1Data.bio || undefined, skills, interests });
      toast.success("Profile complete!");
      setLoadingRecs(true);
      try {
        var res = await profileApi.getRecommendedContent();
        setRecommended(res.data.data);
      } catch { setRecommended([]); }
      finally { setLoadingRecs(false); }
      setStep(4);
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setIsSubmitting(false); }
  }

  var current = STEPS.find(function(s) { return s.id === step; })!;

  return (
    <div className="w-full max-w-lg">

      {/* Step progress */}
      <div className="mb-8">
        <div className="flex items-center mb-6">
          {STEPS.map(function(s, idx) {
            var done    = step > s.id;
            var active  = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={[
                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                    done   ? "bg-brand-600 text-white"
                    : active ? "bg-brand-600 text-white ring-4 ring-brand-100"
                    : "bg-white/80 text-surface-400 border border-surface-200"
                  ].join(" ")}>
                    {done ? <CheckCircle2 size={14} /> : <span className="text-[11px]">{s.id}</span>}
                  </div>
                  <span className={["text-[9px] font-bold uppercase tracking-wider",
                    active ? "text-brand-600" : done ? "text-brand-400" : "text-surface-400"
                  ].join(" ")}>{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 mb-4 rounded-full bg-surface-200 overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all duration-500"
                      style={{ width: step > s.id ? "100%" : "0%" }} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-surface-900 tracking-tight">{current.title}</h1>
          <p className="text-sm text-surface-500 mt-1">{current.desc}</p>
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="auth-form-card animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center mb-5">
            <User size={16} className="text-indigo-400" />
          </div>
          <p className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-5">Step 1 of 4</p>
          <form onSubmit={step1Form.handleSubmit(handleStep1Next)} className="space-y-4" noValidate>
            <Input label="Location" placeholder="e.g. San Francisco, CA"
              leftIcon={<MapPin size={14} />}
              error={step1Form.formState.errors.location?.message}
              hint="Optional — shown on your public profile."
              {...step1Form.register("location")} />
            <Input label="Website" type="url" placeholder="https://yoursite.com"
              leftIcon={<Globe size={14} />}
              error={step1Form.formState.errors.website?.message}
              {...step1Form.register("website")} />
            <div>
              <label className="label">Bio</label>
              <textarea {...step1Form.register("bio")} rows={3}
                placeholder="Tell the community a bit about yourself..."
                className="input resize-none" />
              {step1Form.formState.errors.bio && (
                <p className="field-error">{step1Form.formState.errors.bio.message}</p>
              )}
              <p className="field-hint">Max 300 characters. Shown publicly on your profile.</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={function() { router.push("/feed"); }}
                className="text-sm text-slate-500 hover:text-slate-300 font-semibold transition-colors">
                Skip for now
              </button>
              <Button type="submit" rightIcon={<ArrowRight size={14} />}>Continue</Button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="auth-form-card animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center mb-5">
            <Tag size={16} className="text-violet-400" />
          </div>
          <p className="text-[10px] font-bold text-violet-400 tracking-widest uppercase mb-5">Step 2 of 4</p>
          <div className="space-y-5">
            <div>
              <label className="label">Add skills</label>
              <div className="flex gap-2">
                <Input placeholder="Type a skill and press Enter"
                  value={skillInput}
                  onChange={function(e) { setSkillInput(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
                  leftIcon={<Tag size={14} />}
                  className="flex-1" />
                <Button type="button" variant="secondary" onClick={function() { addSkill(skillInput); }}>Add</Button>
              </div>
              {skillError && <p className="field-error mt-1.5">{skillError}</p>}
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick add</p>
              <div className="flex flex-wrap gap-2">
                {SKILL_SUGGESTIONS.filter(function(s) { return !skills.includes(s); }).map(function(s) {
                  return (
                    <button key={s} type="button" onClick={function() { addSkill(s); }}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                      onMouseOver={function(e) { var el = e.currentTarget as HTMLButtonElement; el.style.background = "rgba(99,102,241,0.15)"; el.style.borderColor = "rgba(99,102,241,0.4)"; el.style.color = "#a5b4fc"; }}
                      onMouseOut={function(e) { var el = e.currentTarget as HTMLButtonElement; el.style.background = "rgba(255,255,255,0.07)"; el.style.borderColor = "rgba(255,255,255,0.1)"; el.style.color = "rgba(255,255,255,0.6)"; }}>
                      + {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {skills.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Your skills ({skills.length}/15)</p>
                <div className="flex flex-wrap gap-2">
                  {skills.map(function(s) {
                    return (
                      <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.35)", color: "#a5b4fc" }}>
                        {s}
                        <button type="button" onClick={function() { removeSkill(s); }}
                          className="hover:text-white transition-colors ml-0.5" style={{ color: "#818cf8" }}>
                          <X size={10} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="secondary" leftIcon={<ArrowLeft size={14} />}
                onClick={function() { setStep(1); }}>Back</Button>
              <Button type="button" onClick={handleStep2Next} rightIcon={<ArrowRight size={14} />}>Continue</Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="auth-form-card animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center mb-5">
            <Sparkles size={16} className="text-indigo-400" />
          </div>
          <p className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-5">Step 3 of 4</p>
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Select topics ({interests.length}/10)</p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map(function(interest) {
                  var selected = interests.includes(interest);
                  return (
                    <button key={interest} type="button" onClick={function() { toggleInterest(interest); }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
                      style={selected ? {
                        background: "linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.25))",
                        border: "1px solid rgba(99,102,241,0.5)", color: "#a5b4fc",
                        boxShadow: "0 0 12px rgba(99,102,241,0.2)"
                      } : {
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)"
                      }}>
                      {selected && <Check size={10} />}
                      {interest}
                    </button>
                  );
                })}
              </div>
              {interestError && <p className="field-error mt-2">{interestError}</p>}
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="secondary" leftIcon={<ArrowLeft size={14} />}
                onClick={function() { setStep(2); }}>Back</Button>
              <Button type="button" loading={isSubmitting} onClick={handleStep3Next}
                rightIcon={!isSubmitting ? <Sparkles size={14} /> : undefined}>
                {isSubmitting ? "Saving..." : "Complete profile"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div className="animate-fade-in space-y-4">
          <div className="auth-form-card">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.2))", border: "1px solid rgba(99,102,241,0.35)", boxShadow: "0 0 20px rgba(99,102,241,0.2)" }}>
                <Sparkles size={18} className="text-indigo-300" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-0.5">All done</p>
                <p className="text-sm font-bold text-white">Profile complete!</p>
                <p className="text-xs text-slate-400">Recommended content based on your interests.</p>
              </div>
            </div>
            {loadingRecs ? (
              <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-indigo-400" /></div>
            ) : recommended.length > 0 ? (
              <div className="space-y-2">
                {recommended.slice(0, 5).map(function(item) {
                  return (
                    <Link key={item._id} href={"/posts/" + item._id}
                      className="block p-3.5 rounded-xl transition-all duration-150"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <p className="text-sm font-semibold text-white line-clamp-1 mb-1">
                        {item.title || item.content.slice(0, 60)}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2">{item.content}</p>
                      {item.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-2.5">
                          {item.tags.slice(0, 3).map(function(tag) {
                            return <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ background: "rgba(99,102,241,0.18)", color: "#a5b4fc" }}>#{tag}</span>;
                          })}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Zap size={24} className="text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No content yet — be the first to post!</p>
              </div>
            )}
          </div>
          <Button fullWidth size="lg" onClick={function() { router.push("/feed"); }} rightIcon={<ArrowRight size={15} />}>
            Go to your feed
          </Button>
        </div>
      )}
    </div>
  );
}