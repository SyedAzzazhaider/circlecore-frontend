"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MapPin, Globe, ArrowRight, ArrowLeft,
  CheckCircle2, Sparkles, Loader2, Tag
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { profileApi, type RecommendedContent } from "@/lib/api/profile.api";
import { getErrorMessage } from "@/lib/api/client";
import {
  onboardingStep1Schema,
  type OnboardingStep1Data
} from "@/lib/validations/profile";
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
  { id: 1, title: "About you",            description: "Help the community get to know you" },
  { id: 2, title: "Your skills",          description: "What do you bring to the table?" },
  { id: 3, title: "Interests",            description: "What topics excite you most?" },
  { id: 4, title: "Recommended for you",  description: "Based on your interests — dive right in" }
];

export default function OnboardingPage() {
  var router = useRouter();
  var [step, setStep]               = useState(1);
  var [isSubmitting, setIsSubmitting] = useState(false);
  var [step1Data, setStep1Data]     = useState<OnboardingStep1Data>({ bio: "" });
  var [skills, setSkills]           = useState<string[]>([]);
  var [skillInput, setSkillInput]   = useState("");
  var [interests, setInterests]     = useState<string[]>([]);
  var [skillError, setSkillError]   = useState("");
  var [interestError, setInterestError] = useState("");
  var [recommended, setRecommended] = useState<RecommendedContent[]>([]);
  var [loadingRecs, setLoadingRecs] = useState(false);

  var step1Form = useForm<OnboardingStep1Data>({
    resolver: zodResolver(onboardingStep1Schema),
    defaultValues: step1Data
  });

  function addSkill(value: string) {
    var trimmed = value.trim();
    if (!trimmed) return;
    if (skills.length >= 15) { setSkillError("Maximum 15 skills"); return; }
    if (skills.includes(trimmed)) { setSkillInput(""); return; }
    setSkills(function(prev) { return [...prev, trimmed]; });
    setSkillInput("");
    setSkillError("");
  }

  function removeSkill(skill: string) {
    setSkills(function(prev) { return prev.filter(function(s) { return s !== skill; }); });
  }

  function toggleInterest(interest: string) {
    if (interests.includes(interest)) {
      setInterests(function(prev) { return prev.filter(function(i) { return i !== interest; }); });
    } else {
      if (interests.length >= 10) { setInterestError("Maximum 10 interests"); return; }
      setInterests(function(prev) { return [...prev, interest]; });
      setInterestError("");
    }
  }

  function handleStep1Next(data: OnboardingStep1Data) {
    setStep1Data(data);
    setStep(2);
  }

  function handleStep2Next() {
    if (skills.length === 0) { setSkillError("Add at least one skill"); return; }
    setSkillError("");
    setStep(3);
  }

  async function handleStep3Next() {
    if (interests.length === 0) { setInterestError("Select at least one interest"); return; }
    setIsSubmitting(true);
    try {
      await profileApi.completeOnboarding({
        bio: step1Data.bio || undefined,
        skills: skills,
        interests: interests
      });
      toast.success("Profile complete!");

      /* Step 5 — fetch recommended content */
      setLoadingRecs(true);
      try {
        var res = await profileApi.getRecommendedContent();
        setRecommended(res.data.data);
      } catch {
        setRecommended([]);
      } finally {
        setLoadingRecs(false);
      }
      setStep(4);
    } catch(err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  var progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-xl">

        {/* Step indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {STEPS.map(function(s, idx) {
                return React.createElement(
                  React.Fragment,
                  { key: s.id },
                  React.createElement(
                    "div",
                    {
                      className: ["w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200",
                        step > s.id ? "bg-brand-600 text-white" :
                        step === s.id ? "bg-brand-600 text-white ring-4 ring-brand-100" :
                        "bg-surface-200 text-surface-400"
                      ].join(" ")
                    },
                    step > s.id
                      ? React.createElement(CheckCircle2, { size: 14 })
                      : String(s.id)
                  ),
                  idx < STEPS.length - 1 && React.createElement("div", {
                    className: "h-0.5 w-10 rounded-full transition-all duration-300",
                    style: { background: step > s.id ? "#4f46e5" : "#e2e8f0" }
                  })
                );
              })}
            </div>
            <span className="text-xs text-surface-400 font-medium">{step} of {STEPS.length}</span>
          </div>
          {STEPS.filter(function(s) { return s.id === step; }).map(function(s) {
            return React.createElement("div", { key: s.id },
              React.createElement("h1", { className: "text-2xl font-bold text-surface-900 tracking-tight" }, s.title),
              React.createElement("p", { className: "text-sm text-surface-500 mt-1" }, s.description)
            );
          })}
        </div>

        {/* Step 1 — Bio */}
        {step === 1 && (
          <div className="auth-card animate-fade-in">
            <form onSubmit={step1Form.handleSubmit(handleStep1Next)} className="space-y-5" noValidate>
              <div>
                <label className="label">Bio</label>
                <textarea
                  {...step1Form.register("bio")}
                  placeholder="Tell the community a bit about yourself..."
                  rows={3}
                  className="input resize-none"
                />
                {step1Form.formState.errors.bio && (
                  <p className="field-error">{step1Form.formState.errors.bio.message}</p>
                )}
                <p className="field-hint">Max 300 characters. Shown on your public profile.</p>
              </div>
              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={function() { router.push("/feed"); }} className="text-sm text-surface-400 hover:text-surface-600 transition-colors font-medium">
                  Skip for now
                </button>
                <Button type="submit" rightIcon={React.createElement(ArrowRight, { size: 15 })}>Continue</Button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2 — Skills */}
        {step === 2 && (
          <div className="auth-card animate-fade-in">
            <div className="space-y-5">
              <div>
                <label className="label">Add skills</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      {React.createElement(Tag, { size: 14 })}
                    </span>
                    <input
                      value={skillInput}
                      onChange={function(e) { setSkillInput(e.target.value); }}
                      onKeyDown={function(e) { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
                      placeholder="Type a skill and press Enter"
                      className="input pl-10"
                    />
                  </div>
                  <Button type="button" variant="secondary" onClick={function() { addSkill(skillInput); }}>Add</Button>
                </div>
                {skillError && <p className="field-error mt-1.5">{skillError}</p>}
              </div>

              <div>
                <p className="text-xs font-semibold text-surface-500 mb-2">Quick add</p>
                <div className="flex flex-wrap gap-2">
                  {SKILL_SUGGESTIONS.filter(function(s) { return !skills.includes(s); }).map(function(s) {
                    return React.createElement("button", {
                      key: s, type: "button",
                      onClick: function() { addSkill(s); },
                      className: "px-3 py-1 rounded-full text-xs font-medium bg-surface-100 text-surface-600 hover:bg-brand-50 hover:text-brand-700 transition-colors border border-surface-200 hover:border-brand-200"
                    }, "+ " + s);
                  })}
                </div>
              </div>

              {skills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-surface-500 mb-2">Your skills ({skills.length}/15)</p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map(function(s) {
                      return React.createElement("span", {
                        key: s,
                        className: "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200"
                      },
                        s,
                        React.createElement("button", {
                          type: "button",
                          onClick: function() { removeSkill(s); },
                          className: "ml-0.5 text-brand-400 hover:text-brand-700"
                        }, "\u00d7")
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <Button type="button" variant="ghost" leftIcon={React.createElement(ArrowLeft, { size: 15 })} onClick={function() { setStep(1); }}>Back</Button>
                <Button type="button" onClick={handleStep2Next} rightIcon={React.createElement(ArrowRight, { size: 15 })}>Continue</Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Interests */}
        {step === 3 && (
          <div className="auth-card animate-fade-in">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-surface-500 mb-3">Select topics ({interests.length}/10)</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map(function(interest) {
                    var selected = interests.includes(interest);
                    return React.createElement("button", {
                      key: interest, type: "button",
                      onClick: function() { toggleInterest(interest); },
                      className: ["px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 border",
                        selected ? "bg-brand-600 text-white border-brand-600 shadow-sm" : "bg-white text-surface-600 border-surface-200 hover:border-brand-300 hover:text-brand-700"
                      ].join(" ")
                    },
                      selected && React.createElement(CheckCircle2, { size: 11, style: { display: "inline", marginRight: "4px" } }),
                      interest
                    );
                  })}
                </div>
                {interestError && <p className="field-error mt-2">{interestError}</p>}
              </div>
              <div className="flex justify-between items-center pt-2">
                <Button type="button" variant="ghost" leftIcon={React.createElement(ArrowLeft, { size: 15 })} onClick={function() { setStep(2); }}>Back</Button>
                <Button type="button" loading={isSubmitting} onClick={handleStep3Next} rightIcon={!isSubmitting ? React.createElement(Sparkles, { size: 15 }) : undefined}>
                  {isSubmitting ? "Saving..." : "Complete profile"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Recommended Content (PRD Step 5) */}
        {step === 4 && (
          <div className="animate-fade-in">
            <div className="auth-card mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Sparkles size={18} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-surface-900">Your profile is complete!</p>
                  <p className="text-xs text-surface-500">Here is what we recommend based on your interests.</p>
                </div>
              </div>

              {loadingRecs ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-brand-500" />
                </div>
              ) : recommended.length > 0 ? (
                <div className="space-y-2">
                  {recommended.slice(0, 5).map(function(item) {
                    return React.createElement(
                      Link,
                      { key: item._id, href: "/posts/" + item._id, className: "block p-3 rounded-xl hover:bg-surface-50 border border-surface-100 hover:border-brand-200 transition-all" },
                      React.createElement("p", { className: "text-sm font-semibold text-surface-900 line-clamp-1 mb-1" }, item.title || item.content.slice(0, 60)),
                      React.createElement("p", { className: "text-xs text-surface-400 line-clamp-2" }, item.content),
                      item.tags.length > 0 && React.createElement(
                        "div",
                        { className: "flex gap-1 mt-2" },
                        item.tags.slice(0, 3).map(function(tag) {
                          return React.createElement("span", { key: tag, className: "px-2 py-0.5 rounded-full text-xs bg-brand-50 text-brand-600 font-medium" }, "#" + tag);
                        })
                      )
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-surface-400">No content yet — be the first to post!</p>
                </div>
              )}
            </div>

            <Button fullWidth size="lg" onClick={function() { router.push("/feed"); }} rightIcon={React.createElement(ArrowRight, { size: 15 })}>
              Go to your feed
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
