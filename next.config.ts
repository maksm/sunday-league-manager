import type { NextConfig } from 'next';

// Validate environment variables at build time
import './src/lib/env';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push('@node-rs/argon2', '@node-rs/bcrypt');
    return config;
  },
  turbopack: {}, // Silence Turbopack warning
};

export default withPWA(nextConfig);
