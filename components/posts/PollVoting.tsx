"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { feedApi, type PollOption } from "@/lib/api/feed.api";
import { useAuthStore } from "@/lib/store/auth.store";
import { getErrorMessage } from "@/lib/api/client";
import toast from "react-hot-toast";

type PollVotingProps = {
  postId:    string;
  options:   PollOption[];
  isLocked?: boolean;
  onVote?:   (updatedOptions: PollOption[]) => void;
};

export function PollVoting({ postId, options, isLocked, onVote }: PollVotingProps) {
  var { user }    = useAuthStore();
  var [voting, setVoting]           = useState(false);
  var [localOptions, setLocalOptions] = useState<PollOption[]>(options);

  var hasVoted    = localOptions.some(function(o) { return o.hasVoted; });
  var total       = localOptions.reduce(function(sum, o) { return sum + o.voteCount; }, 0);
  var showResults = hasVoted || isLocked || !user;
  var maxVotes    = Math.max(...localOptions.map(function(o) { return o.voteCount; }));

  async function handleVote(optionId: string) {
    if (voting || hasVoted || isLocked || !user) return;
    setVoting(true);
    try {
      var res     = await feedApi.votePoll(postId, optionId);
      var updated = (res.data as any).data?.pollOptions as PollOption[] | undefined;
      if (updated && updated.length > 0) {
        setLocalOptions(updated);
        if (onVote) onVote(updated);
      } else {
        setLocalOptions(function(prev) {
          return prev.map(function(o) {
            return o._id === optionId
              ? Object.assign({}, o, { hasVoted: true, voteCount: o.voteCount + 1 })
              : o;
          });
        });
      }
      toast.success("Vote recorded!");
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setVoting(false); }
  }

  return (
    <div className="space-y-2 mb-4">
      {localOptions.map(function(option) {
        var pct       = total > 0 ? Math.round((option.voteCount / total) * 100) : 0;
        var isWinner  = option.voteCount === maxVotes && total > 0;
        var isVotable = !hasVoted && !isLocked && !!user;
        return (
          <button
            key={option._id}
            type="button"
            onClick={function() { handleVote(option._id); }}
            disabled={voting || !isVotable}
            className="w-full relative overflow-hidden rounded-xl border transition-all duration-200 text-left"
            style={{
              borderColor: option.hasVoted ? "rgba(99,102,241,0.4)" : "#e2e8f0",
              background:  "white",
              cursor:      isVotable ? "pointer" : "default",
              boxShadow:   option.hasVoted ? "0 0 0 2px rgba(99,102,241,0.12)" : "none"
            }}>
            {showResults && (
              <div
                className="absolute inset-y-0 left-0 rounded-xl transition-all duration-700 ease-out"
                style={{
                  width:      pct + "%",
                  background: option.hasVoted
                    ? "linear-gradient(90deg,rgba(99,102,241,0.15),rgba(139,92,246,0.10))"
                    : isWinner
                      ? "rgba(99,102,241,0.05)"
                      : "rgba(0,0,0,0.02)"
                }}
              />
            )}
            <div className="relative flex items-center justify-between px-4 h-11 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {option.hasVoted
                  ? <CheckCircle2 size={13} className="text-brand-600 shrink-0" />
                  : voting
                    ? <Loader2 size={13} className="animate-spin text-surface-400 shrink-0" />
                    : <div className="w-3.5 h-3.5 rounded-full border-2 shrink-0"
                        style={{ borderColor: isVotable ? "#6366f1" : "#cbd5e1" }} />
                }
                <span className={[
                  "text-sm font-semibold truncate",
                  option.hasVoted ? "text-brand-700" : "text-surface-700"
                ].join(" ")}>
                  {option.text}
                </span>
              </div>
              {showResults && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-surface-400 font-medium">{option.voteCount}</span>
                  <span className={[
                    "text-xs font-black min-w-[32px] text-right",
                    option.hasVoted ? "text-brand-600" : isWinner ? "text-surface-700" : "text-surface-400"
                  ].join(" ")}>
                    {pct}%
                  </span>
                </div>
              )}
            </div>
          </button>
        );
      })}
      <p className="text-[11px] text-surface-400 font-medium px-1">
        {total} {total === 1 ? "vote" : "votes"}
        {!user    && " \u00b7 Sign in to vote"}
        {isLocked && " \u00b7 Poll closed"}
      </p>
    </div>
  );
}
