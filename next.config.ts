import type { NextConfig } from "next";
import urlRedirects from "./src/data/url-redirects.json";
import contentLinkRepairs from "./src/data/content-link-repairs.json";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: "standalone",
  serverExternalPackages: ['geoip-lite'],
  outputFileTracingIncludes: {
    '/api/chat-visibility': ['./node_modules/geoip-lite/data/**/*'],
  },
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 65, 70, 75, 80],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "z-cdn.chatglm.cn",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async redirects() {
    return [
      ...[...urlRedirects, ...contentLinkRepairs].map(({ source, destination }) => ({
        source,
        destination,
        statusCode: 301 as const,
      })),
      {
        source: "/:path*",
        has: [{ type: "host", value: "jacketee.com" }],
        destination: "https://www.jacketee.com/:path*",
        permanent: true,
      },
      {
        source: "/favicon.ico",
        destination: "/logo.webp",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://cdn.botpress.cloud https://files.bpcontent.cloud",
              "style-src 'self' 'unsafe-inline' https://cdn.botpress.cloud https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com https://z-cdn.chatglm.cn https://i.ytimg.com https://www.google-analytics.com https://*.google-analytics.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://webchat.botpress.cloud wss://webchat.botpress.cloud https://cdn.botpress.cloud https://files.bpcontent.cloud",
              "media-src 'self' https://res.cloudinary.com",
              "frame-src 'self' https://www.youtube-nocookie.com https://cdn.botpress.cloud",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
