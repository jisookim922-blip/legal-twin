import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { jaJP } from "@clerk/localizations";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "LegalTwin - もう一人の自分を、24時間雇う。",
  description:
    "弁護士のための分身AI。過去の判例・契約書・戦略メモを学習し、相談受付から事件終結まで全5フェーズを半自動化します。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LegalTwin",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-512.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={jaJP}>
      <html lang="ja" className="h-full antialiased">
        <body className="min-h-full">
          {children}
          <ServiceWorkerRegister />
        </body>
      </html>
    </ClerkProvider>
  );
}
