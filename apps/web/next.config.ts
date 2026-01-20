import type { NextConfig } from "next";


import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Custom Caching Strategies for Enterprise App Data Integrity
  workboxOptions: {
    skipWaiting: true,
    runtimeCaching: [
      // 1. APIs & Server Actions: NETWORK ONLY (Never cache sensitive project data)
      {
        urlPattern: /^https:\/\/timework\.penerbitkbm\.com\/api\/.*/i,
        handler: "NetworkOnly",
      },
      // 2. Next.js Data/JSON: NETWORK FIRST (Fresh data when online, fallback if offline)
      {
        urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "next-data",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      // 3. Static Assets (Images, Fonts): STALE WHILE REVALIDATE (Fast load)
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|woff2)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          },
        },
      },
      // 4. Document/Pages: NETWORK FIRST (Always try to get fresh page first)
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        urlPattern: ({ request }: any) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
    ],
  },
});

import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@repo/database', '@stackframe/stack'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'content.stack-auth.com',
      }
    ],
  },
};

export default withPWA(nextConfig);
// export default nextConfig;
