import Link from "next/link";
import {
  ArrowRight, Lock, Shield, Star,
  Zap, Users, Globe, CheckCircle2
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#06080f] text-white overflow-x-hidden">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(ellipse at center, rgba(67,56,202,0.35) 0%, transparent 70%)",
            filter: "blur(80px)"
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(ellipse at center, rgba(126,34,206,0.2) 0%, transparent 70%)",
            filter: "blur(80px)"
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "64px 64px"
          }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between max-w-6xl mx-auto px-6 py-5 border-b border-white/5">
        <CCLogo />
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors rounded-xl hover:bg-white/5"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-brand-600 hover:bg-brand-500 transition-all duration-150"
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 2px 12px rgba(99,102,241,0.4)" }}
          >
            Request access
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-28 pb-24 text-center">
        <div
          className="inline-flex items-center gap-2.5 mb-10 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide text-brand-300 animate-fade-in"
          style={{
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.2)"
          }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-500" />
          </span>
          Private beta — invite only
        </div>

        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.04] tracking-tight mb-6 text-balance animate-slide-up delay-1"
        >
          Where serious
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #a5b4fc 0%, #818cf8 40%, #c084fc 100%)" }}
          >
            communities thrive
          </span>
        </h1>

        <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10 text-balance leading-relaxed animate-slide-up delay-2">
          An invite-only platform built for{" "}
          <span className="text-white/75">deep engagement</span>,{" "}
          <span className="text-white/75">quality content</span>, and{" "}
          <span className="text-white/75">meaningful connections</span>.
          No noise. No strangers.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up delay-3">
          <Link
            href="/register"
            className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-all duration-200"
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 2px 20px rgba(99,102,241,0.5)" }}
          >
            Enter invite code
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Sign in
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-14 text-xs text-white/30 animate-fade-in delay-5">
          {["Founders", "Researchers", "Builders", "Designers", "Operators"].map((tag) => (
            <span key={tag} className="flex items-center gap-1.5">
              <CheckCircle2 size={11} className="text-brand-500" />
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl p-6 transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)"
              }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${f.iconBg}`}>
                {f.icon}
              </div>
              <h3 className="text-[0.9375rem] font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-[0.8125rem] text-white/45 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-2xl mx-auto px-6 py-16">
        <div
          className="relative overflow-hidden rounded-3xl p-12 text-center"
          style={{
            background: "linear-gradient(135deg, #3730a3 0%, #4f46e5 50%, #7c3aed 100%)",
            boxShadow: "0 0 80px -20px rgba(99,102,241,0.6)"
          }}
        >
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)" }}
          />
          <div className="relative">
            <div
              className="inline-flex items-center gap-2 text-white/70 text-xs font-semibold px-3 py-1 rounded-full mb-5"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <Lock size={10} />
              Invite-only
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Have an invite code?</h2>
            <p className="text-white/60 text-sm mb-8">You are one step away from your community.</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-6 py-3 rounded-xl text-sm hover:bg-brand-50 transition-colors shadow-lg"
            >
              Create account
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <CCLogo />
          <p className="text-xs text-white/25">
            {`© ${new Date().getFullYear()} CircleCore — Private beta`}
          </p>
          <div className="flex gap-6 text-xs text-white/30">
            <Link href="/login"    className="hover:text-white/60 transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-white/60 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CCLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center"
        style={{ boxShadow: "0 0 12px rgba(99,102,241,0.4)" }}
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="white" />
        </svg>
      </div>
      <span className="font-bold text-white tracking-tight text-[15px]">CircleCore</span>
    </div>
  );
}

const FEATURES = [
  {
    icon:    <Lock  size={17} className="text-brand-400"   />,
    iconBg:  "bg-brand-500/10",
    title:   "Invite-only access",
    description: "Every member is vouched for. No spam, no bots — only curated, verified professionals."
  },
  {
    icon:    <Star  size={17} className="text-amber-400"   />,
    iconBg:  "bg-amber-500/10",
    title:   "Reputation signals",
    description: "Deep profiles with skills, interests, and scores that reflect real contributions."
  },
  {
    icon:    <Zap   size={17} className="text-emerald-400" />,
    iconBg:  "bg-emerald-500/10",
    title:   "Real-time engagement",
    description: "Live reactions, comments, and presence indicators powered by Socket.IO and Redis."
  },
  {
    icon:    <Users size={17} className="text-violet-400"  />,
    iconBg:  "bg-violet-500/10",
    title:   "Nested communities",
    description: "Organize around topics, projects, or cohorts with dedicated channels and threads."
  },
  {
    icon:    <Globe  size={17} className="text-sky-400"   />,
    iconBg:  "bg-sky-500/10",
    title:   "Events and meetups",
    description: "Schedule webinars and meetups with built-in RSVP, calendar sync, and reminders."
  },
  {
    icon:    <Shield size={17} className="text-rose-400"  />,
    iconBg:  "bg-rose-500/10",
    title:   "Tiered membership",
    description: "Free, Premium, and Enterprise tiers with Stripe and Razorpay billing built in."
  }
];
