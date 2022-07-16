import fs from "fs";
import { NextPageContext } from "next";
import { getPublishedPosts } from "fetcher/post";

const Sitemap = () => {};


export const getServerSideProps = async ({ res }: NextPageContext ) => {
  const baseUrl = {
    test: "http://localhost:3001",
    development: "http://localhost:3001",
    production: "https://vyquocvu.co",
  }[process.env.NODE_ENV];

  const posts = await getPublishedPosts();
  const dynamicRoutes = posts.map(post => `${baseUrl}/post/${post?.title?.replace(/ /g, '-').toLocaleLowerCase()}.${post?.uid}`)

  const staticPages = fs
    .readdirSync("pages")
    .filter((staticPage) => {
      return ![
        "_app.tsx",
        "_document.tsx",
        "_error.tsx",
        "sitemap.xml.tsx",
        "post",
        "admin",
        "api"
      ].includes(staticPage);
    })
    .map((staticPagePath) => {
      return `${baseUrl}/${staticPagePath.replace(".tsx", "").replace("index", "")}`;
    });


    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${[...staticPages, ...dynamicRoutes]
        .map((url) => {
          return `
            <url>
              <loc>${url}</loc>
              <lastmod>${new Date().toISOString()}</lastmod>
              <changefreq>monthly</changefreq>
              <priority>1.0</priority>
            </url>
          `;
        })
        .join("")}
    </urlset>
  `;

  if (res) {
    res.setHeader("Content-Type", "text/xml");
    res.write(sitemap);
    res.end();
  }

  return {
    props: {},
  };
};

export default Sitemap;