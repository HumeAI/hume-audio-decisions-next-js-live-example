import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { THEME_SCRIPT } from "@/lib/theme";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Live Audio Decisions",
  description:
    "Ask questions about live microphone audio and see the answers on a timeline.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script sets `data-theme` on this element before React
    // hydrates, so the server's markup is expected to differ there.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
