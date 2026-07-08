import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { NewsletterPopup } from "@/components/newsletter-popup";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { SupportChatWidget } from "@/components/support-chat-widget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LUXE STORE - Premium Fashion & Activewear",
  description: "Discover premium fashion, activewear, and outdoor apparel. Quality meets elegance at Luxe Store.",
  keywords: ["Luxe Store", "Fashion", "Activewear", "Outdoor", "Clothing", "Apparel", "Sportswear"],
  authors: [{ name: "LUXE STORE Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "LUXE STORE - Premium Fashion & Activewear",
    description: "Discover premium fashion, activewear, and outdoor apparel",
    url: "https://luxestore.com",
    siteName: "LUXE STORE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LUXE STORE - Premium Fashion & Activewear",
    description: "Discover premium fashion, activewear, and outdoor apparel",
  },
};

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://luxestore.com";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LUXE STORE",
  url: SITE_URL,
  logo: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "LUXE STORE",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Providers>
          {children}
          <NewsletterPopup />
          <CookieConsentBanner />
          <SupportChatWidget />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
