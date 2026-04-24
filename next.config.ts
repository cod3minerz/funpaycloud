import type { NextConfig } from 'next';
import path from 'path';
import createMDX from '@next/mdx';
import WebpackObfuscator from 'webpack-obfuscator';

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
});

const isProduction = process.env.NODE_ENV === 'production';
const enableObfuscation = isProduction && process.env.NEXT_DISABLE_OBFUSCATION !== 'true';
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isProduction ? [] : ["'unsafe-eval'"]),
  'https://www.googletagmanager.com',
  'https://mc.yandex.ru',
  'https://yastatic.net',
].join(' ');

const config: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value:
              `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: wss: https://mc.yandex.ru; frame-ancestors 'none'; base-uri 'self'; object-src 'none'`,
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/platform2',
        destination: '/platform/dashboard',
        permanent: true,
      },
      {
        source: '/platform2/:path*',
        destination: '/platform/:path*',
        permanent: true,
      },
      {
        source: '/blog/kak-ne-teryat-zakazy-nochyu-na-funpay',
        destination: '/blog/kak-sokratit-vremya-otveta-v-chatah-funpay',
        permanent: true,
      },
      {
        source: '/blog/kak-uvelichit-prodazhi-funpay',
        destination: '/blog/kak-uvelichit-vyruchku-bez-rosta-vremeni-v-operacionke',
        permanent: true,
      },
      {
        source: '/blog/bezopasnaya-avtomatizaciya-funpay-checklist',
        destination: '/blog/bezopasnaya-nastrojka-vydachi-cifrovyh-tovarov-funpay',
        permanent: true,
      },
    ];
  },
  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  webpack: (webpackConfig, { dev, isServer }) => {
    if (!dev && !isServer && enableObfuscation) {
      webpackConfig.plugins.push(
        new WebpackObfuscator(
          {
            rotateStringArray: true,
            stringArray: true,
            stringArrayThreshold: 0.75,
            deadCodeInjection: false,
            debugProtection: false,
            selfDefending: true,
            simplify: true,
            splitStrings: true,
            splitStringsChunkLength: 8,
            unicodeEscapeSequence: false,
          },
          ['**/framework-*.js', '**/main-*.js', '**/webpack-*.js'],
        ),
      );
    }
    return webpackConfig;
  },
};

export default withMDX(config);
