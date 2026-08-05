const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");

initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["avatars.githubusercontent.com"],
    unoptimized: true,
  },
  trailingSlash: false,
  experimental: {
    serverComponentsExternalPackages: ["bcrypt-ts"],
  },
};

module.exports = nextConfig;
// rebuilt Wed Aug  5 14:43:11 +07 2026
// rebuilt fresh at Wed Aug  5 14:47:30 +07 2026
