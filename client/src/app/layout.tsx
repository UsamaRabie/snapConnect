import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://snapconnect.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "SnapConnect — Share Your Moments",
    template: "%s | SnapConnect",
  },
  description:
    "SnapConnect is a social media platform for sharing photos, connecting with friends, and exploring your interests.",
  keywords: [
    "social media",
    "photo sharing",
    "SnapConnect",
    "connect with friends",
  ],
  authors: [{ name: "SnapConnect" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SnapConnect",
    title: "SnapConnect — Share Your Moments",
    description:
      "Share photos, connect with friends, and explore your interests on SnapConnect.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SnapConnect",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SnapConnect — Share Your Moments",
    description:
      "Share photos, connect with friends, and explore your interests on SnapConnect.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('snapconnect-theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                  }
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
