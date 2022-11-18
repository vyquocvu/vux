module.exports = {
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
  },
  trailingSlash: true,
  experimental: {
    appDir: true
  },
  exportPathMap: () => ({
    "/": { page: "/", query: { __nextDefaultLocale: "en", __nextLocale: "en" }},
    "/about": { page: "/about" },
    "/contact": { page: "/contact" },
    "/login": { page: "/login" },
    "/signup": { page: "/signup" },
  }),
};
