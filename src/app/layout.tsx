// src/app/layout.tsx
import "./globals.css";
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";

// --- GLOBAL SEO METADATA ---
export const metadata: Metadata = {
  title: "InstaBill | Free UPI Invoice Generator for Freelancers",
  description:
    "Create professional invoices in seconds. Auto-verify UPI payments and UTR numbers instantly. 100% free for Indian freelancers, developers, and agencies.",
  keywords: [
    "UPI invoice generator",
    "freelance billing india",
    "UTR verification",
    "free invoice maker",
    "InstaBill",
  ],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png", // This makes it look great if someone saves it to their iPhone home screen!
  },
  openGraph: {
    title: "InstaBill | Free UPI Invoice Generator",
    description:
      "Create professional invoices in seconds. Auto-verify UPI payments instantly.",
    url: "https://instabill.live",
    siteName: "InstaBill",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "InstaBill Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Changed to a sophisticated warm cream background with charcoal text */}
      <body className="bg-[#FEF9F2] text-[#111827] antialiased selection:bg-indigo-100">
        <Toaster position="bottom-center" />
        {children}
      </body>
    </html>
  );
}
