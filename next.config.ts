import type { NextConfig } from 'next';
import path from 'path';

const config: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
};

export default config;
