/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-extra', 'puppeteer-extra-plugin-stealth'],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }

    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    return config;
  },

  env: {
    CHROMIUM_PATH: process.env.CHROMIUM_PATH || '',
  },
};

module.exports = nextConfig;
