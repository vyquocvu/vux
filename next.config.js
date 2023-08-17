const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  env: {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
  },
  images: {
    domains: ['avatars.githubusercontent.com'],
    unoptimized: true,
  },
  trailingSlash: false,
  exportPathMap: () => ({
    "/": { page: "/", query: { __nextDefaultLocale: "vi", __nextLocale: "vi", __nextDataReq: "" }},
    "/about": { page: "/about", query: { __nextDefaultLocale: "vi", __nextLocale: "vi" } },
    "/contact": { page: "/contact", query: { __nextDefaultLocale: "vi", __nextLocale: "vi" } },
    "/login": { page: "/login", query: { __nextDefaultLocale: "vi", __nextLocale: "vi" } },
    "/signup": { page: "/signup", query: { __nextDefaultLocale: "vi", __nextLocale: "vi" } },
  }),
});
