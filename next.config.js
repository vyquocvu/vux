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
    // OpenNext on Cloudflare: marks `react-dom/server.edge` so Next.js
    // bundles it into the Worker instead of leaving it as an optional
    // dependency that the runtime can't resolve.
    // See https://opennext.js.org/cloudflare/troubleshooting
    serverComponentsExternalPackages: ["react-dom/server.edge"],
  },
};

module.exports = nextConfig;
