import Link from "next/link";
import { Users, Zap } from "lucide-react";

var FEATURE_CARDS = [
  {
    tag: "FOR MEMBERS",
    Icon: Users,
    iconColor: "text-indigo-500",
    iconBg: "rgba(99,102,241,0.1)",
    tagColor: "text-indigo-500",
    text: "Build real connections with vetted professionals across 120+ niche communities."
  },
  {
    tag: "FOR BUILDERS",
    Icon: Zap,
    iconColor: "text-violet-500",
    iconBg: "rgba(139,92,246,0.1)",
    tagColor: "text-violet-500",
    text: "Launch events, discussions and grow your reputation with a verified audience."
  }
];

var STATS = [
  { value: "2,400+", label: "Members"     },
  { value: "120+",   label: "Communities" },
  { value: "100%",   label: "Invite-only" }
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page-bg min-h-screen flex">

      {/* ── LEFT HERO PANEL ───────────────────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 px-12 xl:px-20 py-10 min-h-screen justify-between">

        <div>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group self-start mb-12">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-glow-sm group-hover:scale-105 transition-transform">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-surface-900 text-[15px] tracking-tight">CircleCore</span>
          </Link>

          {/* Invite-only badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-indigo-100 text-xs font-bold text-indigo-700 tracking-wider uppercase w-fit mb-6 shadow-sm backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Invite-only platform
          </div>

          {/* Headline */}
          <h1 className="text-[2.8rem] xl:text-[3.25rem] font-black text-surface-900 leading-[1.06] tracking-tight mb-4">
            The space where<br />
            elite communities<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500">
              thrive.
            </span>
          </h1>

          <p className="text-base text-surface-500 leading-relaxed mb-10 max-w-xs">
            Identity-first. Reputation-driven. Built for the builders, thinkers, and leaders who refuse to settle.
          </p>

          {/* ── FEATURE CARDS ─────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {FEATURE_CARDS.map(function(card) {
              return (
                <div
                  key={card.tag}
                  className="flex items-center gap-4 w-fit pl-2.5 pr-7 py-3"
                  style={{
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "0.5px solid rgba(255,255,255,0.85)",
                    boxShadow: [
                      "0 2px 4px rgba(99,102,241,0.04)",
                      "0 4px 12px rgba(99,102,241,0.07)",
                      "0 12px 28px rgba(99,102,241,0.06)",
                      "inset 0 1px 0 rgba(255,255,255,0.9)"
                    ].join(", ")
                  }}
                >
                  {/* Squircle icon container */}
                  <div
                    className={"w-9 h-9 flex items-center justify-center shrink-0 " + card.iconColor}
                    style={{
                      borderRadius: "50%",
                      background: card.iconBg,
                    }}
                  >
                    <card.Icon size={15} />
                  </div>

                  {/* Text */}
                  <div>
                    <span
                      className={"block text-[9px] font-medium uppercase mb-1 " + card.tagColor}
                      style={{ letterSpacing: "0.14em" }}
                    >
                      {card.tag}
                    </span>
                    <span
                      className="block text-[11.5px] text-surface-600 font-medium"
                      style={{ lineHeight: "1.65", maxWidth: "192px" }}
                    >
                      {card.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STATS ROW */}
        <div className="flex items-center gap-0">
          {STATS.map(function(stat, i) {
            return (
              <div key={stat.label} className="flex items-center">
                <div className="flex flex-col pr-6">
                  <span className="text-2xl font-black text-surface-900 leading-none tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mt-1.5">
                    {stat.label}
                  </span>
                </div>
                {i < STATS.length - 1 && (
                  <div className="h-8 w-px bg-surface-200 mr-6 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* ── RIGHT FORM COLUMN ─────────────────────────────────── */}
      <div className="flex-1 lg:flex-initial lg:w-[520px] xl:w-[560px] flex flex-col min-h-screen lg:mr-12 xl:mr-20">

        <div className="flex items-center justify-between px-5 py-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-surface-900 text-sm tracking-tight">CircleCore</span>
          </Link>
          <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Invite-only</span>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-8 lg:px-8 lg:py-12">
          <div className="auth-form-card w-full animate-slide-up">
            {children}
          </div>
        </div>

        <div className="flex items-center justify-between px-8 py-5">
          <p className="text-xs text-surface-400">&copy; {new Date().getFullYear()} CircleCore</p>
          <div className="flex gap-5">
            <a href="#" className="text-xs text-surface-400 hover:text-surface-600 transition-colors">Privacy</a>
            <a href="#" className="text-xs text-surface-400 hover:text-surface-600 transition-colors">Terms</a>
          </div>
        </div>

      </div>
    </div>
  );
}