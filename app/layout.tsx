import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BondSpace. — make sense of bonds",
  description:
    "Where to park cash, right now. T-bills, HYSA, MMFs, CDs, Treasury notes — ranked by horizon, with FDIC/SIPC, lockup, and tax treatment. Plain English. Daily refresh.",
  metadataBase: new URL("https://treasury-compass.etoro.app"),
  openGraph: {
    title: "BondSpace.",
    description: "Make sense of bonds — where to park cash, right now.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F4" },
    { media: "(prefers-color-scheme: dark)", color: "#0E0F12" },
  ],
};

// Theme bootstrap — runs before paint, no FOUC. NEVER ternary the same value
// on both branches; that's the documented gotcha #1 in the skill.
const themeBootstrap = `
(function () {
  try {
    var saved = localStorage.getItem('tyc-theme');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var mode = saved ? saved : (systemDark ? 'dark' : 'light');
    if (mode === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <link
          rel="preconnect"
          href="https://api.etorostatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
