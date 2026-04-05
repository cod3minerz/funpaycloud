import type { NextConfig } from 'next';
import path from 'path';

const config: NextConfig = {
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

export default config;
