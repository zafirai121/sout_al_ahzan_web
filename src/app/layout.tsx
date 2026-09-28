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
    url: 'https://web.soutalahzan.com',
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
  // Google needs a square favicon whose size is a multiple of 48px
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "صوت الأحزان",
  },
};
export const viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              var isBot = /bot|crawl|spider|slurp|Google-InspectionTool|Lighthouse/i.test(navigator.userAgent);
              if (!isBot && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768)) {
                window.location.replace('https://zafirai121.github.io/sawt-alahzan-app/');
              }
            `,
          }}
        />
      </head>
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
