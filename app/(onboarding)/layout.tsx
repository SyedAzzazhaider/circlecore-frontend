import Link from "next/link";

export default function OnboardingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-50">
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-surface-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center"
            style={{ boxShadow: "0 0 12px rgba(99,102,241,0.3)" }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-surface-900 text-[15px] tracking-tight">
            CircleCore
          </span>
        </Link>
        <span className="text-xs font-medium text-surface-400">
          Complete your profile
        </span>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
