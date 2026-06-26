import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com; img-src 'self' data: https://*.supabase.co; style-src 'self' 'unsafe-inline'; frame-src 'self' https://checkout.razorpay.com;"
  }
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    const cspValue = `default-src 'self'; script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com; img-src 'self' data: https://*.supabase.co; style-src 'self' 'unsafe-inline'; frame-src 'self' https://checkout.razorpay.com;`;

    return [
      {
        source: '/:path*',
        headers: [
          ...securityHeaders.filter(h => h.key !== 'Content-Security-Policy'),
          {
            key: 'Content-Security-Policy',
            value: cspValue
          }
        ],
      },
    ];
  },
};

export default nextConfig;
