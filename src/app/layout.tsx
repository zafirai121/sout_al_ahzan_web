import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "صوت الأحزان | منصة البث المباشر",
  description: "المنصة الأولى للقصائد واللطميات الحسينية",
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
