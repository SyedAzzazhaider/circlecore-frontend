import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "@/styles/globals.css";

export var metadata: Metadata = {
  title: {
    default:  "CircleCore",
    template: "%s | CircleCore"
  },
  description: "Invite-only community platform for deep engagement and meaningful connections."
};

export var viewport: Viewport = {
  themeColor:   "#6366f1",
  width:        "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4500,
            style: {
              background:   "#0f172a",
              color:        "#f8fafc",
              border:       "1px solid #1e293b",
              borderRadius: "0.875rem",
              fontSize:     "0.875rem",
              fontWeight:   "500",
              padding:      "0.875rem 1rem"
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#f8fafc" } },
            error:   { iconTheme: { primary: "#ef4444", secondary: "#f8fafc" } }
          }}
        />
      </body>
    </html>
  );
}
