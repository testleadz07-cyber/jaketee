import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { NewsletterPopup } from "@/components/newsletter-popup";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { SupportChatWidget } from "@/components/support-chat-widget";
import { SessionTracker } from "@/components/SessionTracker";
import { GoogleAnalytics } from "@/components/google-analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.jacketee.com";
const HOME_TITLE = "Custom Varsity & Bomber Jackets | Jacketee";
const HOME_DESCRIPTION = "Shop varsity, bomber, leather, puffer, and other jackets at Jacketee. Explore custom colors, patches, embroidery, and bulk order options.";
const DEFAULT_SOCIAL_IMAGE = {
  url: `${SITE_URL}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: "Jacketee custom varsity and letterman jackets",
};
const verification: Metadata["verification"] = {
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : {}),
  ...(process.env.BING_SITE_VERIFICATION
    ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } }
    : {}),
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  authors: [{ name: "Jacketee Team" }],
  verification: Object.keys(verification).length > 0 ? verification : undefined,
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: SITE_URL,
    siteName: "Jacketee",
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [DEFAULT_SOCIAL_IMAGE.url],
  },
  other: {
    webmcp: "/.well-known/mcp.json",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Jacketee",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  foundingDate: "2026",
  email: "info@jacketee.com",
  telephone: "+92 318 7328027",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Adalat Garh",
    addressRegion: "Punjab",
    addressCountry: "PK",
  },
  sameAs: [
    "https://www.facebook.com/jacketeeofficial",
    "https://www.instagram.com/jack_etee/",
    "https://www.tiktok.com/@jacketeeofficial",
    "https://www.youtube.com/@jacketeeofficial",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    telephone: "+92 318 7328027",
    email: "info@jacketee.com",
    url: `${SITE_URL}/contact`,
    availableLanguage: ["en"],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Jacketee",
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/shop?search={search_term_string}`,
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
          <SessionTracker />
          <GoogleAnalytics />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
