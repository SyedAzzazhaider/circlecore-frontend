"use client";

import React, { useState } from "react";
import { X, Flag, AlertTriangle, ChevronDown } from "lucide-react";
import { moderationApi, FlagReason, ContentType } from "@/lib/api/moderation.api";
import { getErrorMessage } from "@/lib/api/client";
import toast from "react-hot-toast";

type Props = {
  contentType: ContentType;
  contentId: string;
  communityId?: string;
  onClose: () => void;
};

var FLAG_REASONS: { value: FlagReason; label: string; desc: string }[] = [
  { value: "spam",             label: "Spam",              desc: "Unsolicited promotional or repetitive content" },
  { value: "harassment",       label: "Harassment",        desc: "Targeted harassment or bullying of a person" },
  { value: "hate_speech",      label: "Hate speech",       desc: "Content attacking people based on identity" },
  { value: "misinformation",   label: "Misinformation",    desc: "False or misleading claims" },
  { value: "explicit_content", label: "Explicit content",  desc: "Adult content not appropriate for this community" },
  { value: "violence",         label: "Violence",          desc: "Graphic violence or threats of violence" },
  { value: "off_topic",        label: "Off-topic",         desc: "Content not relevant to this community" },
  { value: "impersonation",    label: "Impersonation",     desc: "Pretending to be someone else" },
  { value: "other",            label: "Other",             desc: "Something else not listed above" },
];

export function FlagModal({ contentType, contentId, communityId, onClose }: Props) {
  var [reason, setReason]       = useState<FlagReason | "">("");
  var [description, setDescription] = useState("");
  var [submitting, setSubmitting]   = useState(false);

  async function handleSubmit() {
    if (!reason) { toast.error("Please select a reason"); return; }
    setSubmitting(true);
    try {
      await moderationApi.submitFlag({
        contentType, contentId,
        communityId,
        reason: reason as FlagReason,
        description,
      });
      toast.success("Report submitted. Our moderators will review it.");
      onClose();
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-surface-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-100 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg,#fff7ed 0%,#fff 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center">
              <Flag size={16} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-surface-900">Report content</h2>
              <p className="text-xs text-surface-500 font-medium capitalize">{contentType}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition-colors">
            <X size={14} className="text-surface-600" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              False reports waste moderator time. Only report content that genuinely violates community rules.
            </p>
          </div>

          <div>
            <label className="text-xs font-black text-surface-700 uppercase tracking-wider block mb-2.5">
              Reason <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={reason}
                onChange={function(e) { setReason(e.target.value as FlagReason); }}
                className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl border border-surface-200 bg-white text-sm text-surface-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all">
                <option value="">Select a reason...</option>
                {FLAG_REASONS.map(function(r) {
                  return <option key={r.value} value={r.value}>{r.label}</option>;
                })}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            </div>
            {reason && (
              <p className="text-xs text-surface-500 mt-1.5 pl-1">
                {FLAG_REASONS.find(function(r) { return r.value === reason; })?.desc}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-black text-surface-700 uppercase tracking-wider block mb-2.5">
              Additional details <span className="text-surface-400 font-medium normal-case">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={function(e) { setDescription(e.target.value); }}
              placeholder="Provide any additional context to help moderators review this report..."
              maxLength={1000}
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 bg-white text-sm text-surface-900 resize-none focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all placeholder:text-surface-400"
            />
            <p className="text-[10px] text-surface-400 mt-1 text-right">{description.length}/1000</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-100 flex gap-3 justify-end bg-surface-50">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-surface-600 hover:bg-surface-200 transition-colors border border-surface-200">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting || !reason}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: submitting || !reason ? undefined : "linear-gradient(135deg,#f97316,#ef4444)" }}>
            {submitting ? "Submitting..." : "Submit report"}
          </button>
        </div>
      </div>
    </div>
  );
}
