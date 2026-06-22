import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

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
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
