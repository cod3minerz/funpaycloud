import type { NextConfig } from 'next';
import path from 'path';
import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
});

const config: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
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
    ];
  },
  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
};

export default withMDX(config);
