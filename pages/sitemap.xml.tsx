import { NextPageContext } from "next";
import { getPublishedPosts } from "fetcher/post";
import config from "config";

import { friendlyStr } from "utils/common";

const Sitemap = () => {};


export const getServerSideProps = async ({ res }: NextPageContext ) => {
  const baseUrl = (process.env.NODE_ENV === "production"
    ? config.host
    : "http://localhost:3001"
  ).replace(/\/$/, "");

  const posts = await getPublishedPosts();
  const dynamicRoutes = posts.map(post => `${baseUrl}/post/${friendlyStr(post.title)}.${post?.uid}`)
  const staticPages = ['', '/contact', '/about'].map((path) => `${baseUrl}${path}`);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${[...staticPages, ...dynamicRoutes]
        .map((url) => {
          return `
            <url>
              <loc>${url}</loc>
              <lastmod>${new Date().toISOString()}</lastmod>
              <changefreq>daily</changefreq>
              <priority>1.0</priority>
            </url>
          `;
        })
        .join("")}
    </urlset>
  `;

  if (res) {
    res.setHeader("Content-Type", "text/xml");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=600, stale-while-revalidate=86400",
    );
    res.write(sitemap);
    res.end();
  }

  return {
    props: {},
  };
};

export default Sitemap;