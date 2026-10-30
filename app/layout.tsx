import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hume Audio Decisions API: Next.js Example",
  description:
    "Ask the Hume Decisions API questions about live audio and see answers while it plays.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
