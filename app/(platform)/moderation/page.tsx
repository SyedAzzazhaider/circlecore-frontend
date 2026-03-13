"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield, Flag, AlertTriangle, ClipboardList,
  CheckCircle2, XCircle, Clock, ChevronDown,
  RefreshCw, Eye, Loader2, Users, Ban,
  TriangleAlert, ScrollText, Sparkles, Filter,
  UserX, UserCheck, Trash2, Check, X
} from "lucide-react";
import {
  moderationApi,
  Flag as FlagType, Warning, AuditLog,
  ModerationStats, FlagStatus, FlagResolution, WarningSeverity
} from "@/lib/api/moderation.api";
import { getErrorMessage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth.store";
import toast from "react-hot-toast";

type Tab = "queue" | "warnings" | "audit";

var FLAG_REASON_LABELS: Record<string, string> = {
  spam: "Spam", harassment: "Harassment", hate_speech: "Hate Speech",
  misinformation: "Misinformation", explicit_content: "Explicit Content",
  violence: "Violence", off_topic: "Off-Topic", impersonation: "Impersonation", other: "Other"
};

var SEVERITY_CONFIG: Record<WarningSeverity, { label: string; color: string; bg: string }> = {
  minor: { label: "Minor",  color: "#d97706", bg: "#fffbeb" },
  major: { label: "Major",  color: "#dc2626", bg: "#fff1f2" },
  final: { label: "Final",  color: "#7c3aed", bg: "#f5f3ff" },
};

var ACTION_LABELS: Record<string, string> = {
  "flag.reviewed":    "Flag Reviewed",
  "flag.dismissed":   "Flag Dismissed",
  "flag.resolved":    "Flag Resolved",
  "content.removed":  "Content Removed",
  "content.restored": "Content Restored",
  "warning.issued":   "Warning Issued",
  "warning.revoked":  "Warning Revoked",
  "user.suspended":   "User Suspended",
  "user.unsuspended": "User Unsuspended",
  "user.banned":      "User Banned",
  "user.unbanned":    "User Unbanned",
  "user.blocked":     "User Blocked",
  "user.unblocked":   "User Unblocked",
  "user.role_changed":"Role Changed",
  "community.locked": "Community Locked",
  "community.unlocked":"Community Unlocked",
};

/* ─────────────────────────────────────────────────── */
/*  Review Flag Modal                                  */
/* ─────────────────────────────────────────────────── */
function ReviewFlagModal({ flag, onClose, onDone }: {
  flag: FlagType;
  onClose: () => void;
  onDone: () => void;
}) {
  var [status, setStatus]         = useState<FlagStatus>("resolved");
  var [resolution, setResolution] = useState<FlagResolution>("no_action");
  var [note, setNote]             = useState("");
  var [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await moderationApi.reviewFlag(flag._id, { status, resolution, resolutionNote: note });
      toast.success("Flag reviewed successfully");
      onDone();
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-surface-200">
        <div className="px-6 py-5 border-b border-surface-100 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg,#eff6ff 0%,#fff 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-100 border border-brand-200 flex items-center justify-center">
              <Eye size={15} className="text-brand-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-surface-900">Review flag</h2>
              <p className="text-xs text-surface-500 font-medium">
                {FLAG_REASON_LABELS[flag.reason]} · {flag.contentType}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition-colors">
            <X size={14} className="text-surface-600" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {flag.description && (
            <div className="px-4 py-3 rounded-xl bg-surface-50 border border-surface-200">
              <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">Reporter note</p>
              <p className="text-sm text-surface-700">{flag.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-surface-600 uppercase tracking-wider block mb-2">
                Outcome
              </label>
              <div className="relative">
                <select value={status} onChange={function(e) { setStatus(e.target.value as FlagStatus); }}
                  className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl border border-surface-200 bg-white text-sm font-medium text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all">
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                  <option value="under_review">Keep under review</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-black text-surface-600 uppercase tracking-wider block mb-2">
                Resolution
              </label>
              <div className="relative">
                <select value={resolution} onChange={function(e) { setResolution(e.target.value as FlagResolution); }}
                  className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl border border-surface-200 bg-white text-sm font-medium text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all">
                  <option value="no_action">No action</option>
                  <option value="content_removed">Remove content</option>
                  <option value="user_warned">Warn user</option>
                  <option value="user_suspended">Suspend user</option>
                  <option value="user_banned">Ban from community</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-surface-600 uppercase tracking-wider block mb-2">
              Moderator note <span className="text-surface-400 font-medium normal-case">(optional)</span>
            </label>
            <textarea rows={2} value={note} onChange={function(e) { setNote(e.target.value); }}
              placeholder="Internal note for audit trail..."
              maxLength={1000}
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm text-surface-900 resize-none focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all placeholder:text-surface-400" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-surface-100 flex gap-3 justify-end bg-surface-50">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-surface-600 hover:bg-surface-200 transition-colors border border-surface-200">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
            {submitting ? "Submitting..." : "Submit review"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/*  Issue Warning Modal                                */
/* ─────────────────────────────────────────────────── */
function IssueWarningModal({ userId, userName, onClose, onDone }: {
  userId: string; userName: string; onClose: () => void; onDone: () => void;
}) {
  var [severity, setSeverity]   = useState<WarningSeverity>("minor");
  var [reason, setReason]       = useState("");
  var [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reason.trim()) { toast.error("Reason is required"); return; }
    setSubmitting(true);
    try {
      await moderationApi.issueWarning({ userId, reason, severity });
      toast.success("Warning issued successfully");
      onDone();
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-surface-200">
        <div className="px-6 py-5 border-b border-surface-100 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg,#fff7ed 0%,#fff 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
              <TriangleAlert size={15} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-surface-900">Issue warning</h2>
              <p className="text-xs text-surface-500 font-medium">{userName}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition-colors">
            <X size={14} className="text-surface-600" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-black text-surface-600 uppercase tracking-wider block mb-2.5">Severity</label>
            <div className="grid grid-cols-3 gap-2">
              {(["minor","major","final"] as WarningSeverity[]).map(function(s) {
                var cfg = SEVERITY_CONFIG[s];
                var active = severity === s;
                return (
                  <button key={s} type="button" onClick={function() { setSeverity(s); }}
                    className={["px-3 py-2.5 rounded-xl text-xs font-bold border transition-all",
                      active ? "border-current shadow-sm" : "border-surface-200 bg-white text-surface-600 hover:border-surface-300"
                    ].join(" ")}
                    style={active ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color } : {}}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-surface-600 uppercase tracking-wider block mb-2.5">
              Reason <span className="text-red-400">*</span>
            </label>
            <textarea rows={3} value={reason} onChange={function(e) { setReason(e.target.value); }}
              placeholder="Explain clearly why this warning is being issued..."
              maxLength={1000}
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm text-surface-900 resize-none focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all placeholder:text-surface-400" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-surface-100 flex gap-3 justify-end bg-surface-50">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-surface-600 hover:bg-surface-200 transition-colors border border-surface-200">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting || !reason.trim()}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}>
            {submitting ? "Issuing..." : "Issue warning"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/*  Main Page                                          */
/* ─────────────────────────────────────────────────── */
export default function ModerationPage() {
  var { user } = useAuthStore();
  var [activeTab, setActiveTab] = useState<Tab>("queue");

  /* Stats */
  var [stats, setStats] = useState<ModerationStats | null>(null);
  var [statsLoading, setStatsLoading] = useState(true);

  /* Flags */
  var [flags, setFlags]           = useState<FlagType[]>([]);
  var [flagsLoading, setFlagsLoading] = useState(false);
  var [flagStatus, setFlagStatus] = useState<FlagStatus>("pending");
  var [flagPage, setFlagPage]     = useState(1);
  var [flagTotal, setFlagTotal]   = useState(0);
  var [reviewTarget, setReviewTarget] = useState<FlagType | null>(null);

  /* Warnings */
  var [warningUserId, setWarningUserId] = useState("");
  var [warnings, setWarnings]           = useState<Warning[]>([]);
  var [warningsLoading, setWarningsLoading] = useState(false);
  var [warningModal, setWarningModal]   = useState<{ userId: string; name: string } | null>(null);

  /* Audit */
  var [auditLogs, setAuditLogs]     = useState<AuditLog[]>([]);
  var [auditLoading, setAuditLoading] = useState(false);
  var [auditPage, setAuditPage]     = useState(1);
  var [auditTotal, setAuditTotal]   = useState(0);

  var isModerator = user && ["moderator","admin","super_admin"].includes(user.role);

  /* Load stats */
  useEffect(function() {
    if (!isModerator) return;
    moderationApi.getStats()
      .then(function(res) {
        var body = res.data as unknown as { data: { stats: ModerationStats } };
        setStats(body.data.stats);
      })
      .catch(function() {})
      .finally(function() { setStatsLoading(false); });
  }, [isModerator]);

  /* Load flags */
  var loadFlags = useCallback(function() {
    if (!isModerator) return;
    setFlagsLoading(true);
    moderationApi.getReviewQueue({ status: flagStatus, page: flagPage, limit: 15 })
      .then(function(res) {
        var body = res.data as unknown as { data: { data: FlagType[]; total: number } };
        setFlags(body.data.data || []);
        setFlagTotal(body.data.total || 0);
      })
      .catch(function(err) { toast.error(getErrorMessage(err)); })
      .finally(function() { setFlagsLoading(false); });
  }, [isModerator, flagStatus, flagPage]);

  useEffect(function() { if (activeTab === "queue") loadFlags(); }, [activeTab, loadFlags]);

  /* Load warnings */
  function loadWarnings() {
    if (!warningUserId.trim()) { toast.error("Enter a user ID"); return; }
    setWarningsLoading(true);
    moderationApi.getUserWarnings(warningUserId)
      .then(function(res) {
        var body = res.data as unknown as { data: { data: Warning[] } };
        setWarnings(body.data.data || []);
      })
      .catch(function(err) { toast.error(getErrorMessage(err)); })
      .finally(function() { setWarningsLoading(false); });
  }

  /* Load audit */
  var loadAudit = useCallback(function() {
    if (!isModerator) return;
    setAuditLoading(true);
    moderationApi.getAuditLogs({ page: auditPage, limit: 20 })
      .then(function(res) {
        var body = res.data as unknown as { data: { data: AuditLog[]; total: number } };
        setAuditLogs(body.data.data || []);
        setAuditTotal(body.data.total || 0);
      })
      .catch(function(err) { toast.error(getErrorMessage(err)); })
      .finally(function() { setAuditLoading(false); });
  }, [isModerator, auditPage]);

  useEffect(function() { if (activeTab === "audit") loadAudit(); }, [activeTab, loadAudit]);

  if (!isModerator) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-red-400" />
          </div>
          <h2 className="text-lg font-black text-surface-900 mb-2">Access restricted</h2>
          <p className="text-sm text-surface-500">Moderation tools are only available to moderators and admins.</p>
        </div>
      </div>
    );
  }

  var STAT_CARDS = [
    { label: "Pending flags",    value: stats?.pendingFlags ?? "—",    icon: <Flag size={16} />,         color: "#f97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.2)" },
    { label: "Resolved today",   value: stats?.resolvedToday ?? "—",   icon: <CheckCircle2 size={16} />, color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)" },
    { label: "Active warnings",  value: stats?.activeWarnings ?? "—",  icon: <AlertTriangle size={16} />,color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)" },
    { label: "Suspended users",  value: stats?.suspendedUsers ?? "—",  icon: <UserX size={16} />,        color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"  },
    { label: "Total flags",      value: stats?.totalFlagsAllTime ?? "—",icon: <ScrollText size={16} />,  color: "#6366f1", bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.2)" },
    { label: "Dismissed today",  value: stats?.dismissedToday ?? "—",  icon: <XCircle size={16} />,      color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.2)" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#f0f2ff 0%,#f8fafc 280px)" }}>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl mb-8 px-7 py-6"
          style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#4f46e5 60%,#7c3aed 100%)", boxShadow: "0 8px 32px rgba(79,70,229,0.35)" }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='0.8' fill='white'/%3E%3C/svg%3E\")" }} />
          <div className="absolute right-6 top-0 bottom-0 flex items-center opacity-5">
            <Shield size={120} className="text-white" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shrink-0">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={12} className="text-purple-300" />
                <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">Module H</span>
              </div>
              <h1 className="text-xl font-black text-white tracking-tight">Moderation & Safety</h1>
              <p className="text-sm text-indigo-200 font-medium">Review flags · Issue warnings · Audit trail</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {stats?.pendingFlags ? (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/20 border border-red-400/30 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-sm font-black text-white">{stats.pendingFlags} pending</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {STAT_CARDS.map(function(card) {
            return (
              <div key={card.label} className="bg-white rounded-2xl border p-4 flex flex-col gap-2 transition-all hover:-translate-y-0.5"
                style={{ borderColor: card.border, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: card.bg }}>
                  <span style={{ color: card.color }}>{card.icon}</span>
                </div>
                <div>
                  <p className="text-xl font-black text-surface-900">
                    {statsLoading ? <Loader2 size={14} className="animate-spin text-surface-400" /> : card.value}
                  </p>
                  <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider leading-tight mt-0.5">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-2xl border border-surface-200 mb-5 w-fit"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          {([
            { id: "queue" as Tab,    label: "Flag Queue",  icon: <Flag size={14} />,         badge: stats?.pendingFlags },
            { id: "warnings" as Tab, label: "Warnings",    icon: <AlertTriangle size={14} />, badge: null },
            { id: "audit" as Tab,    label: "Audit Log",   icon: <ClipboardList size={14} />, badge: null },
          ]).map(function(tab) {
            var active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={function() { setActiveTab(tab.id); }}
                className={["flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                  active ? "bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-sm" : "text-surface-600 hover:text-surface-900 hover:bg-surface-100"
                ].join(" ")}>
                {tab.icon}
                {tab.label}
                {tab.badge ? (
                  <span className={["text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                    active ? "bg-white/25 text-white" : "bg-red-100 text-red-600"
                  ].join(" ")}>{tab.badge}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* ── FLAG QUEUE TAB ── */}
        {activeTab === "queue" && (
          <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-surface-100 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 p-1 bg-surface-100 rounded-xl">
                {(["pending","under_review","resolved","dismissed"] as FlagStatus[]).map(function(s) {
                  return (
                    <button key={s} onClick={function() { setFlagStatus(s); setFlagPage(1); }}
                      className={["px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                        flagStatus === s ? "bg-white text-surface-900 shadow-sm" : "text-surface-500 hover:text-surface-800"
                      ].join(" ")}>
                      {s.replace("_"," ")}
                    </button>
                  );
                })}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-surface-400 font-medium">{flagTotal} total</span>
                <button onClick={loadFlags}
                  className="w-8 h-8 rounded-xl bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition-colors">
                  <RefreshCw size={13} className="text-surface-600" />
                </button>
              </div>
            </div>

            {/* Flag list */}
            {flagsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={20} className="animate-spin text-brand-500" />
              </div>
            ) : flags.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
                  <Check size={20} className="text-surface-400" />
                </div>
                <p className="text-sm font-bold text-surface-500">No {flagStatus.replace("_"," ")} flags</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100">
                {flags.map(function(flag) {
                  return (
                    <div key={flag._id} className="px-6 py-4 hover:bg-surface-50 transition-colors group">
                      <div className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                          <Flag size={14} className="text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-black px-2 py-0.5 rounded-full"
                              style={{ background: "#fee2e2", color: "#dc2626" }}>
                              {FLAG_REASON_LABELS[flag.reason] || flag.reason}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 capitalize">
                              {flag.contentType}
                            </span>
                            <span className={["text-xs font-bold px-2 py-0.5 rounded-full capitalize",
                              flag.status === "pending" ? "bg-amber-100 text-amber-700" :
                              flag.status === "resolved" ? "bg-emerald-100 text-emerald-700" :
                              flag.status === "dismissed" ? "bg-surface-100 text-surface-500" :
                              "bg-blue-100 text-blue-700"
                            ].join(" ")}>
                              {flag.status.replace("_"," ")}
                            </span>
                          </div>
                          <p className="text-xs text-surface-500 font-medium">
                            Reported by <strong className="text-surface-700">{flag.flaggedBy?.name || "Unknown"}</strong>
                            {" · "}{new Date(flag.createdAt).toLocaleDateString()}
                          </p>
                          {flag.description && (
                            <p className="text-xs text-surface-500 mt-1 leading-relaxed line-clamp-2">{flag.description}</p>
                          )}
                        </div>
                        {flag.status === "pending" && (
                          <button
                            onClick={function() { setReviewTarget(flag); }}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                            Review
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {flagTotal > 15 && (
              <div className="px-6 py-4 border-t border-surface-100 flex items-center justify-between">
                <span className="text-xs text-surface-400 font-medium">
                  Page {flagPage} of {Math.ceil(flagTotal / 15)}
                </span>
                <div className="flex gap-2">
                  <button disabled={flagPage === 1} onClick={function() { setFlagPage(function(p) { return p - 1; }); }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-surface-200 text-surface-600 disabled:opacity-40 hover:bg-surface-100 transition-colors">
                    Previous
                  </button>
                  <button disabled={flagPage >= Math.ceil(flagTotal / 15)} onClick={function() { setFlagPage(function(p) { return p + 1; }); }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-surface-200 text-surface-600 disabled:opacity-40 hover:bg-surface-100 transition-colors">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── WARNINGS TAB ── */}
        {activeTab === "warnings" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-surface-200 p-6"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <h3 className="text-xs font-black text-surface-500 uppercase tracking-widest mb-4">Look up user warnings</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={warningUserId}
                  onChange={function(e) { setWarningUserId(e.target.value); }}
                  placeholder="Paste a user ID..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all font-mono placeholder:font-sans placeholder:text-surface-400"
                />
                <button onClick={loadWarnings}
                  disabled={warningsLoading}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all flex items-center gap-2"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                  {warningsLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                  Lookup
                </button>
                <button
                  onClick={function() {
                    if (!warningUserId.trim()) { toast.error("Enter a user ID first"); return; }
                    setWarningModal({ userId: warningUserId, name: "User " + warningUserId.slice(-6) });
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Issue warning
                </button>
              </div>
            </div>

            {warnings.length > 0 && (
              <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="px-6 py-4 border-b border-surface-100">
                  <p className="text-xs font-black text-surface-500 uppercase tracking-widest">
                    {warnings.length} warning{warnings.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                <div className="divide-y divide-surface-100">
                  {warnings.map(function(w) {
                    var cfg = SEVERITY_CONFIG[w.severity];
                    return (
                      <div key={w._id} className="px-6 py-4 hover:bg-surface-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{ background: cfg.bg, borderColor: cfg.color + "40" }}>
                            <TriangleAlert size={14} style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-black px-2.5 py-1 rounded-full border"
                                style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color + "40" }}>
                                {cfg.label}
                              </span>
                              {!w.isActive && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface-100 text-surface-400">
                                  Expired
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-surface-700 leading-relaxed mb-1">{w.reason}</p>
                            <p className="text-xs text-surface-400 font-medium">
                              Issued by <strong className="text-surface-600">{w.issuedBy?.name}</strong>
                              {" · "}{new Date(w.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AUDIT LOG TAB ── */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
              <p className="text-xs font-black text-surface-500 uppercase tracking-widest">
                {auditTotal} total entries
              </p>
              <button onClick={loadAudit}
                className="w-8 h-8 rounded-xl bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition-colors">
                <RefreshCw size={13} className="text-surface-600" />
              </button>
            </div>

            {auditLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={20} className="animate-spin text-brand-500" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
                  <ScrollText size={20} className="text-surface-400" />
                </div>
                <p className="text-sm font-bold text-surface-500">No audit logs yet</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100">
                {auditLogs.map(function(log) {
                  return (
                    <div key={log._id} className="px-6 py-3.5 hover:bg-surface-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                          <ClipboardList size={13} className="text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-surface-900">
                              {ACTION_LABELS[log.action] || log.action}
                            </span>
                            <span className="text-xs font-medium text-surface-500">
                              by <strong className="text-surface-700">{log.performedBy?.name || "Unknown"}</strong>
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-100 text-surface-500 capitalize">
                              {log.performedByRole?.replace("_"," ")}
                            </span>
                          </div>
                          <p className="text-xs text-surface-400 font-medium mt-0.5">
                            Target: <span className="text-surface-500 font-mono text-[10px]">{log.targetId}</span>
                            {" · "}{new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {auditTotal > 20 && (
              <div className="px-6 py-4 border-t border-surface-100 flex items-center justify-between">
                <span className="text-xs text-surface-400 font-medium">
                  Page {auditPage} of {Math.ceil(auditTotal / 20)}
                </span>
                <div className="flex gap-2">
                  <button disabled={auditPage === 1} onClick={function() { setAuditPage(function(p) { return p - 1; }); }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-surface-200 text-surface-600 disabled:opacity-40 hover:bg-surface-100 transition-colors">
                    Previous
                  </button>
                  <button disabled={auditPage >= Math.ceil(auditTotal / 20)} onClick={function() { setAuditPage(function(p) { return p + 1; }); }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-surface-200 text-surface-600 disabled:opacity-40 hover:bg-surface-100 transition-colors">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modals */}
      {reviewTarget && (
        <ReviewFlagModal
          flag={reviewTarget}
          onClose={function() { setReviewTarget(null); }}
          onDone={function() { setReviewTarget(null); loadFlags(); }}
        />
      )}

      {warningModal && (
        <IssueWarningModal
          userId={warningModal.userId}
          userName={warningModal.name}
          onClose={function() { setWarningModal(null); }}
          onDone={function() { setWarningModal(null); loadWarnings(); }}
        />
      )}
    </div>
  );
}
