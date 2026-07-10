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
    url: 'https://sout-al-ahzan-web.pages.dev',
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
    icon: '/icon-512x512.jpg',
    shortcut: '/icon-512x512.jpg',
    apple: '/icon-512x512.jpg',
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
              if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768) {
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
