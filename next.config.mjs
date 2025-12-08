const ContentSecurityPolicy = `
  default-src 'self' www.google-analytics.com *.s3.us-east-1.amazonaws.com;
  img-src * blob: data:;
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src *  'unsafe-inline';
  font-src 'self' fonts.gstatic.com fonts.googleapis.com;
`;

// these are the security headers
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  },
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
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  transpilePackages: ['@mui/x-data-grid'],
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/:path*',
        headers: securityHeaders
      },
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=1, stale-while-revalidate=59'
          }
        ]
      }
    ];
  },
  images: {
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.s3.us-east-1.amazonaws.com',
        pathname: '**'
      }
    ]
  },
  env: {
    CACHE_ENABLED: process.env.CACHE_ENABLED
  }
};

export default nextConfig;
