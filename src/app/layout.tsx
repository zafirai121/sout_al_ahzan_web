import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "صوت الأحزان | Sout Al Ahzan",
  description: "منصة صوت الأحزان - المنصة الأولى للاستماع للقصائد واللطميات الحسينية والمواليد والأدعية بجودة عالية وبدون إعلانات. استمع إلى أفضل الرواديد.",
  keywords: ["صوت الأحزان", "لطميات", "قصائد حسينية", "مواليد", "نعي", "أدعية", "محرم", "عاشوراء", "رواديد", "Sout Al Ahzan", "Soutalahzan"],
  authors: [{ name: "Sout Al Ahzan" }],
  creator: "Sout Al Ahzan",
  publisher: "Sout Al Ahzan",
  openGraph: {
    title: "صوت الأحزان | Sout Al Ahzan",
    description: "منصة صوت الأحزان - المنصة الأولى للاستماع للقصائد واللطميات الحسينية.",
    url: 'https://soutalahzan.com',
    siteName: 'صوت الأحزان',
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "صوت الأحزان | Sout Al Ahzan",
    description: "المنصة الأولى للقصائد واللطميات الحسينية.",
  },
  manifest: "/manifest.json",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
