import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "github-markdown-css";
import { Analytics } from "@vercel/analytics/react";
import AppConfig from "./config";
import { Toaster } from "@/components/ui/sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Legal RAG Playground",
  description:
    "A teaching tool for law students: watch each step of a retrieval-augmented generation (RAG) pipeline run over real legal sources, from text splitting to retrieval to the model's answer.",
  keywords: [
    "RAG",
    "Retrieval-Augmented Generation",
    "legal research",
    "legal AI",
    "hallucination",
    "Vector Embeddings",
    "Semantic Search",
    "Text Splitting",
    "law school",
  ],
  authors: [{ name: "Vanderbilt AI Law Lab" }, { name: "Kain (RAG-Play)" }],
  openGraph: {
    title: "Legal RAG Playground",
    description:
      "Watch each step of a RAG pipeline run over real legal sources.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Legal RAG Playground",
    description:
      "Watch each step of a RAG pipeline run over real legal sources.",
  },
  // Rendered through the metadata API rather than a hand-written <head>, so an
  // empty or missing value produces no tag at all. A literal "" inside <head>
  // broke hydration on Vercel with React error #329.
  ...(AppConfig.googleSiteVerificationId
    ? { verification: { google: AppConfig.googleSiteVerificationId } }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
        <Toaster />
      </body>
    </html>
  );
}
