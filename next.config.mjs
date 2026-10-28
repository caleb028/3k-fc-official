/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: 'graph.facebook.com' },
      { protocol: 'https', hostname: '**.facebook.com' },
    ],
  },
  outputFileTracingIncludes: {
    '/**': ['./prisma/seed.db', './prisma/dev.db'],
  },
  async redirects() {
    return [
      { source: '/matches', destination: '/fixtures', permanent: false },
      { source: '/standings', destination: '/table', permanent: false },
      { source: '/store', destination: '/shop', permanent: false },
      { source: '/heritage', destination: '/club', permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' }
        ]
      },
      {
        source: '/admin/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' }
        ]
      },
      {
        source: '/account/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, no-cache, must-revalidate' }
        ]
      }
    ];
  }
};

export default nextConfig;
