import Link from "next/link";

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-surface-100">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-surface-900 text-[15px] tracking-tight">CircleCore</span>
        </Link>
        <span className="text-xs text-surface-400 hidden sm:block font-medium">
          Invite-only platform
        </span>
      </nav>

      <main className="flex-1 flex items-start justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md animate-slide-up">
          {children}
        </div>
      </main>

      <footer className="py-5 text-center">
        <p className="text-xs text-surface-400">
          {`© ${new Date().getFullYear()} CircleCore`}
        </p>
      </footer>
    </div>
  );
}
