import Link from "next/link";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page-bg min-h-screen flex flex-col">

      {/* Top nav */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center group-hover:scale-105 transition-transform"
            style={{ boxShadow: "0 0 16px rgba(99,102,241,0.4)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-surface-900 text-[15px] tracking-tight">CircleCore</span>
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-indigo-100 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Profile setup</span>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>

      <footer className="py-4 text-center">
        <p className="text-xs text-surface-400">&copy; {new Date().getFullYear()} CircleCore</p>
      </footer>
    </div>
  );
}