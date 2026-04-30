import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { jaJP } from "@clerk/localizations";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import CookieConsent from "@/components/CookieConsent";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://legal-twin.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LegalTwin - もう一人の自分を、24時間雇う。",
    template: "%s | LegalTwin",
  },
  description:
    "弁護士のための分身AI。過去の判例・契約書・戦略メモを学習し、相談受付から事件終結まで全5フェーズを半自動化。守秘義務対応・国内処理・改ざん防止監査ログ完備。",
  keywords: [
    "弁護士",
    "AI",
    "リーガルテック",
    "訴訟書面",
    "判例検索",
    "分身AI",
    "守秘義務",
    "LegalTwin",
  ],
  authors: [{ name: "LegalTwin" }],
  creator: "LegalTwin",
  publisher: "LegalTwin",
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
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: "LegalTwin",
    title: "LegalTwin - もう一人の自分を、24時間雇う。",
    description:
      "弁護士のための分身AI。過去の判例・契約書・戦略メモを学習し、業務を半自動化。",
  },
  twitter: {
    card: "summary_large_image",
    title: "LegalTwin - もう一人の自分を、24時間雇う。",
    description: "弁護士のための分身AI。",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LegalTwin",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Legal Software",
  operatingSystem: "Web",
  description:
    "弁護士のための分身AI。守秘義務を守りながら、訴訟書面の起案・判例検索・期日管理を半自動化。",
  offers: [
    {
      "@type": "Offer",
      name: "Solo",
      price: "9800",
      priceCurrency: "JPY",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "9800",
        priceCurrency: "JPY",
        unitCode: "MON",
      },
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "30000",
      priceCurrency: "JPY",
    },
    {
      "@type": "Offer",
      name: "Elite",
      price: "50000",
      priceCurrency: "JPY",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={jaJP}>
      <html lang="ja" className="h-full antialiased">
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body className="min-h-full">
          {children}
          <CookieConsent />
          <ServiceWorkerRegister />
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
