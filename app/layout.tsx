import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Topic Analyzer",
  description: "Professional multi-perspective analysis of complex topics. Comprehensive examination from multiple ethical, practical, and theoretical frameworks."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
