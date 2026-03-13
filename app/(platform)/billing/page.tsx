"use client";

import React, { useEffect, useState } from "react";
import {
  CreditCard, Check, Loader2, ExternalLink,
  AlertCircle, CheckCircle2, XCircle, Clock,
  Zap, Star, Building2, Sparkles
} from "lucide-react";
import { billingApi, PLANS, type Subscription, type Invoice, type Plan } from "@/lib/api/billing.api";
import { getErrorMessage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth.store";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

var STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active:    { label: "Active",    color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: React.createElement(CheckCircle2, { size: 12 }) },
  trialing:  { label: "Trial",     color: "text-sky-700 bg-sky-50 border-sky-200",             icon: React.createElement(Clock,        { size: 12 }) },
  cancelled: { label: "Cancelled", color: "text-surface-600 bg-surface-100 border-surface-200",icon: React.createElement(XCircle,      { size: 12 }) },
  past_due:  { label: "Past due",  color: "text-red-700 bg-red-50 border-red-200",             icon: React.createElement(AlertCircle,  { size: 12 }) }
};

var PLAN_VISUAL: Record<string, { icon: React.ReactNode; gradient: string; iconBg: string }> = {
  standard: {
    icon:     React.createElement(Zap,      { size: 18 }),
    gradient: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
    iconBg:   "#e2e8f0"
  },
  premium: {
    icon:     React.createElement(Star,     { size: 18 }),
    gradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    iconBg:   "rgba(255,255,255,0.2)"
  },
  enterprise: {
    icon:     React.createElement(Building2,{ size: 18 }),
    gradient: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
    iconBg:   "rgba(255,255,255,0.1)"
  }
};

export default function BillingPage() {
  var { user } = useAuthStore();

  var [subscription,  setSubscription]  = useState<Subscription | null>(null);
  var [invoices,      setInvoices]      = useState<Invoice[]>([]);
  var [loading,       setLoading]       = useState(true);
  var [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(function() {
    Promise.all([
      billingApi.getSubscription().catch(function() { return null; }),
      billingApi.getInvoices().catch(function() { return null; })
    ]).then(function(results) {
      if (results[0]) setSubscription((results[0] as any).data?.data ?? null);
      if (results[1]) setInvoices((results[1] as any).data?.data ?? []);
    }).finally(function() { setLoading(false); });
  }, []);

  async function handleSubscribe(planId: string) {
    setActionLoading(planId);
    try {
      var res = await billingApi.subscribe(planId as "premium");
      if (res.data.data.checkoutUrl) { window.location.href = res.data.data.checkoutUrl; }
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setActionLoading(null); }
  }

  async function handleCancel() {
    if (!confirm("Cancel your subscription? You will keep access until the end of your billing period.")) return;
    setActionLoading("cancel");
    try {
      var res = await billingApi.cancelSubscription();
      setSubscription(res.data.data);
      toast.success("Subscription cancelled. Access continues until period end.");
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setActionLoading(null); }
  }

  async function handleResume() {
    setActionLoading("resume");
    try {
      var res = await billingApi.resumeSubscription();
      setSubscription(res.data.data);
      toast.success("Subscription resumed!");
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setActionLoading(null); }
  }

  async function handlePortal() {
    setActionLoading("portal");
    try {
      var res = await billingApi.getPortalUrl();
      window.open(res.data.data.portalUrl, "_blank");
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setActionLoading(null); }
  }

  var currentPlanId = subscription?.status === "active" || subscription?.status === "trialing"
    ? subscription.planId : "standard";

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center"
          style={{ boxShadow: "0 0 20px rgba(99,102,241,0.15)" }}>
          <Loader2 size={20} className="animate-spin text-brand-500" />
        </div>
        <p className="text-sm text-surface-400 font-medium">Loading billing...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #f0f2ff 0%, #f8fafc 280px)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl mb-8 px-7 py-6"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", boxShadow: "0 6px 24px rgba(99,102,241,0.3)" }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <CreditCard size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Billing & Plans</h1>
              <p className="text-sm text-indigo-200 font-medium">Manage your subscription and payment details.</p>
            </div>
          </div>
        </div>

        {/* Current subscription banner */}
        {subscription && (
          <div className="bg-white border border-surface-200 rounded-2xl p-5 mb-8"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                  <Sparkles size={16} className="text-brand-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-black text-surface-900 capitalize">{subscription.planId}</span>
                    {STATUS_META[subscription.status] && (
                      <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border " + STATUS_META[subscription.status].color}>
                        {STATUS_META[subscription.status].icon}
                        {STATUS_META[subscription.status].label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-surface-400 font-medium">
                    {subscription.cancelAtPeriodEnd
                      ? "Cancels on " + new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                      : "Renews on "  + new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" loading={actionLoading === "portal"}
                  onClick={handlePortal} leftIcon={React.createElement(ExternalLink, { size: 12 })}>
                  Manage billing
                </Button>
                {subscription.cancelAtPeriodEnd
                  ? <Button size="sm" loading={actionLoading === "resume"} onClick={handleResume}>Resume</Button>
                  : <button onClick={handleCancel} disabled={actionLoading === "cancel"}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-all">
                      {actionLoading === "cancel" ? React.createElement(Loader2, { size: 12, className: "animate-spin" }) : null}
                      Cancel plan
                    </button>
                }
              </div>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="mb-3">
          <h2 className="text-xs font-black text-surface-500 uppercase tracking-widest">
            {subscription ? "Change plan" : "Choose a plan"}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {PLANS.map(function(plan) {
            var isCurrent = plan.id === currentPlanId;
            var visual    = PLAN_VISUAL[plan.id] || PLAN_VISUAL.standard;
            var isPremium = plan.isPopular;
            return (
              <div key={plan.id} className={[
                "relative rounded-2xl overflow-hidden transition-all duration-200",
                isPremium ? "ring-2 ring-brand-400 ring-offset-2" : "border border-surface-200",
                !isCurrent ? "hover:shadow-xl hover:shadow-surface-900/[0.07] hover:-translate-y-0.5" : ""
              ].join(" ")}
                style={{ boxShadow: isPremium ? "0 4px 20px rgba(99,102,241,0.2)" : "0 2px 12px rgba(0,0,0,0.05)" }}>

                {plan.isPopular && (
                  <div className="absolute top-0 right-0">
                    <div className="px-3 py-1 text-[10px] font-black text-white rounded-bl-xl"
                      style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                      Most popular
                    </div>
                  </div>
                )}

                {/* Plan header strip */}
                <div className="px-5 pt-5 pb-4" style={{ background: visual.gradient }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: visual.iconBg }}>
                      <span className={isPremium || plan.id === "enterprise" ? "text-white" : "text-surface-600"}>
                        {visual.icon}
                      </span>
                    </div>
                    <div>
                      <h3 className={["text-base font-black", isPremium || plan.id === "enterprise" ? "text-white" : "text-surface-900"].join(" ")}>{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className={["text-xl font-black", isPremium || plan.id === "enterprise" ? "text-white" : "text-surface-900"].join(" ")}>
                          {plan.price === 0 ? "Free" : "$" + plan.price}
                        </span>
                        {plan.price > 0 && (
                          <span className={["text-xs font-medium", isPremium || plan.id === "enterprise" ? "text-white/70" : "text-surface-400"].join(" ")}>
                            / {plan.interval}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="px-5 py-4 bg-white flex-1">
                  <ul className="space-y-2.5 mb-5">
                    {plan.features.map(function(feature) {
                      return (
                        <li key={feature} className="flex items-start gap-2 text-xs text-surface-600">
                          <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      );
                    })}
                  </ul>

                  {isCurrent ? (
                    <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface-100 text-xs font-bold text-surface-500">
                      <CheckCircle2 size={13} className="text-emerald-500" />Current plan
                    </div>
                  ) : (
                    <Button fullWidth variant={plan.isPopular ? "primary" : "secondary"}
                      loading={actionLoading === plan.id}
                      onClick={function() { handleSubscribe(plan.id); }}
                      disabled={plan.price === 0}>
                      {plan.price === 0 ? "Downgrade" : "Upgrade to " + plan.name}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Invoice history */}
        {invoices.length > 0 && (
          <div className="bg-white border border-surface-200 rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div className="px-5 py-4 border-b border-surface-100 flex items-center gap-2">
              <h2 className="text-xs font-black text-surface-500 uppercase tracking-widest">Invoice history</h2>
              <span className="text-[10px] font-bold text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">
                {invoices.length}
              </span>
            </div>
            <div className="divide-y divide-surface-100">
              {invoices.map(function(invoice) {
                return (
                  <div key={invoice._id} className="flex items-center justify-between px-5 py-4 hover:bg-surface-50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-surface-900">{invoice.planName}</p>
                      <p className="text-xs text-surface-400 mt-0.5 font-medium">
                        {new Date(invoice.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={"text-xs font-bold px-2.5 py-1 rounded-full border " +
                        (invoice.status === "paid" ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
                         invoice.status === "open" ? "text-amber-700 bg-amber-50 border-amber-200" :
                         "text-surface-500 bg-surface-100 border-surface-200")}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                      <span className="text-sm font-black text-surface-900 min-w-[48px] text-right">
                        ${(invoice.amount / 100).toFixed(2)}
                      </span>
                      {invoice.invoiceUrl && (
                        <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 flex items-center justify-center rounded-xl text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors border border-transparent hover:border-brand-200">
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
