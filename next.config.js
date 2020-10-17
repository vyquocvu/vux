const withSass = require('@zeit/next-sass');
const withCss = require('@zeit/next-css');
const tailwindCss = require("tailwindcss");
// const withPurgeCss = require("next-purgecss");
require("dotenv").config();

module.exports = withCss(withSass({
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.node = { fs: "empty" };
    }

    const rules = [{
      test: /\.scss$/,
      use: [
          {
            loader: "postcss-loader",
            options: {
            ident: "postcss",
            plugins: [tailwindCss("./tailwind.config.js")]
          }
        },
        { loader: "sass-loader" }
      ]}
    ];
    return {
      ...config,
      module: {
        ...config.module,
        rules: [...config.module.rules, ...rules]
      }
    };
  },
  env: {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
  }
}));
