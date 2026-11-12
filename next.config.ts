import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(self)' },
        ],
      },
      { source: '/api/(.*)', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
  // Links already sent by email or printed in QR codes used the old .html addresses.
  async rewrites() {
    return [
      { source: '/invite.html', destination: '/invite' },
      { source: '/ticket.html', destination: '/ticket' },
      { source: '/staff.html', destination: '/staff' },
      { source: '/index.html', destination: '/' },
    ];
  },
};

export default nextConfig;
