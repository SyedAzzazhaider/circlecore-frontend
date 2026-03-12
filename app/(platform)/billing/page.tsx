"use client";

import React, { useEffect, useState } from "react";
import {
  CreditCard, Check, Loader2, ExternalLink,
  AlertCircle, CheckCircle2, XCircle, Clock
} from "lucide-react";
import { billingApi, PLANS, type Subscription, type Invoice, type Plan } from "@/lib/api/billing.api";
import { getErrorMessage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth.store";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

var STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active:    { label: "Active",     color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: React.createElement(CheckCircle2, { size: 12 }) },
  trialing:  { label: "Trial",      color: "text-sky-700 bg-sky-50 border-sky-200",             icon: React.createElement(Clock,        { size: 12 }) },
  cancelled: { label: "Cancelled",  color: "text-surface-600 bg-surface-100 border-surface-200",icon: React.createElement(XCircle,      { size: 12 }) },
  past_due:  { label: "Past due",   color: "text-danger-700 bg-danger-50 border-danger-200",    icon: React.createElement(AlertCircle,  { size: 12 }) }
};

export default function BillingPage() {
  var { user } = useAuthStore();

  var [subscription, setSubscription] = useState<Subscription | null>(null);
  var [invoices,     setInvoices]     = useState<Invoice[]>([]);
  var [loading,      setLoading]      = useState(true);
  var [actionLoading,setActionLoading]= useState<string | null>(null);

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
      if (res.data.data.checkoutUrl) {
        window.location.href = res.data.data.checkoutUrl;
      }
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
    ? subscription.planId
    : "standard";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
          <CreditCard size={18} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Billing</h1>
          <p className="text-sm text-surface-500">Manage your plan and payment details.</p>
        </div>
      </div>

      {/* Current subscription */}
      {subscription && (
        <div className="card p-5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold text-surface-900 mb-1">Current subscription</h2>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base font-bold text-surface-900 capitalize">{subscription.planId}</span>
                {STATUS_META[subscription.status] && (
                  <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border " + STATUS_META[subscription.status].color}>
                    {STATUS_META[subscription.status].icon}
                    {STATUS_META[subscription.status].label}
                  </span>
                )}
              </div>
              <p className="text-xs text-surface-500">
                {subscription.cancelAtPeriodEnd
                  ? "Cancels on " + new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                  : "Renews on " + new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" loading={actionLoading === "portal"}
                onClick={handlePortal} leftIcon={<ExternalLink size={12} />}>
                Manage billing
              </Button>
              {subscription.cancelAtPeriodEnd
                ? <Button size="sm" loading={actionLoading === "resume"} onClick={handleResume}>Resume</Button>
                : <Button variant="secondary" size="sm" loading={actionLoading === "cancel"}
                    onClick={handleCancel} className="text-danger-600 hover:border-danger-300 hover:bg-danger-50">
                    Cancel
                  </Button>
              }
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <h2 className="text-sm font-bold text-surface-900 mb-4">
        {subscription ? "Change plan" : "Choose a plan"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {PLANS.map(function(plan) {
          var isCurrent = plan.id === currentPlanId;
          return (
            <div key={plan.id}
              className={"card p-5 flex flex-col relative " + (plan.isPopular ? "border-brand-400 ring-1 ring-brand-200" : "")}>
              {plan.isPopular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-brand-600 text-white shadow-sm">
                    Most popular
                  </span>
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-base font-bold text-surface-900">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-surface-900">
                    {plan.price === 0 ? "Free" : "$" + plan.price}
                  </span>
                  {plan.price > 0 && <span className="text-sm text-surface-400">/ {plan.interval}</span>}
                </div>
              </div>
              <ul className="space-y-2 mb-5 flex-1">
                {plan.features.map(function(feature) {
                  return (
                    <li key={feature} className="flex items-start gap-2 text-xs text-surface-600">
                      <Check size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  );
                })}
              </ul>
              {isCurrent ? (
                <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-surface-100 text-xs font-semibold text-surface-500">
                  <CheckCircle2 size={13} className="text-emerald-500" />Current plan
                </div>
              ) : (
                <Button
                  fullWidth
                  variant={plan.isPopular ? "primary" : "secondary"}
                  loading={actionLoading === plan.id}
                  onClick={function() { handleSubscribe(plan.id); }}
                  disabled={plan.price === 0}>
                  {plan.price === 0 ? "Downgrade" : "Upgrade to " + plan.name}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Invoice history */}
      {invoices.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-bold text-surface-900 mb-4">Invoice history</h2>
          <div className="divide-y divide-surface-100">
            {invoices.map(function(invoice) {
              return (
                <div key={invoice._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-surface-900">{invoice.planName}</p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {new Date(invoice.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={"text-xs font-semibold px-2 py-0.5 rounded-full border " +
                      (invoice.status === "paid" ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
                       invoice.status === "open" ? "text-amber-700 bg-amber-50 border-amber-200" :
                       "text-surface-500 bg-surface-100 border-surface-200")}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                    <span className="text-sm font-bold text-surface-900">
                      ${(invoice.amount / 100).toFixed(2)}
                    </span>
                    {invoice.invoiceUrl && (
                      <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-400 hover:text-brand-600 hover:bg-surface-100 transition-colors">
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
  );
}