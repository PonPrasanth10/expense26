import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "StudentSpend – Smart Budget Tracker for Indian Students",
    template: "%s | StudentSpend",
  },
  description:
    "Track daily expenses in ₹, set monthly allowances, and make your money last. Built for Indian college students.",
  keywords: ["expense tracker", "budget", "student", "india", "rupees", "monthly allowance"],
  authors: [{ name: "StudentSpend" }],
  creator: "StudentSpend",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    type: "website",
    title: "StudentSpend – Smart Budget Tracker for Indian Students",
    description: "Track daily expenses in ₹, set monthly allowances, and make your money last.",
    siteName: "StudentSpend",
  },
  twitter: {
    card: "summary",
    title: "StudentSpend",
    description: "Smart budget tracker for Indian college students.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1120" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash — must run before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('ss-theme');
                  var pref = stored === 'dark' || stored === 'light' ? stored :
                    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  if (pref === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.variable}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
