/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily disable CSP headers for development
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         {
  //           key: 'Content-Security-Policy',
  //           value: [
  //             "default-src 'self'",
  //             "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  //             "style-src 'self' 'unsafe-inline'",
  //             "img-src 'self' data: https:",
  //             "connect-src 'self' https: wss:",
  //             "font-src 'self'",
  //             "object-src 'none'",
  //             "base-uri 'self'",
  //             "form-action 'self'",
  //             "frame-ancestors 'none'",
  //             "upgrade-insecure-requests"
  //           ].join('; ')
  //         }
  //       ]
  //     }
  //   ]
  // },
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig
