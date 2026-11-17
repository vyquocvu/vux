import React from 'react';
import Head from 'next/head';
import Image from "next/image";
import Script from 'next/script';

import { Post } from 'interfaces/Post';
import type { LatestPost } from 'interfaces/Post';
import type { TocEntry } from 'utils/toc';
import { buildToc } from 'utils/toc';
import ReadingRail from 'components/Post/ReadingRail';
import PostToc from 'components/Post/PostToc';
import ClapButton from 'components/Post/ClapButton';
import CommentSection from 'components/Post/CommentSection';
import { getLatestPosts, getPostById, getPublishedPostPaths } from "fetcher/post";
import { friendlyStr, highlight, isNextProductionBuild, timeFromNow } from 'utils/common';
import config from 'config';
import Link from 'next/link';

type PostProps = {
  post: Post;
  toc: TocEntry[];
  minutes: number;
  latest: LatestPost[];
}

const PostPage = ({ post, toc = [], minutes = 1, latest = [] }: PostProps) => {
  if (!post?.uid) return (
    <div className="text-center font-body text-muted dark:text-muted-soft py-12">Post not found</div>
  );
  const canonical = `${config.host.replace(/\/$/, "")}/post/${friendlyStr(post.title)}.${post.uid}`;
  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta name="title" content={post.title} />
        <meta name="description" content={post.thumbText} />
        <meta name="keywords" content={config.keywords +", "+ post.tags?.join(",")} />
        <meta name="author" content="Vy Quốc Vũ" />
        {/* Open Graph / Facebook  */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={post.title}/>
        <meta property="og:description" content={post.thumbText}/>
        <meta property="og:image" content={post.thumbImage || config.avatar}/>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.snow.min.css" integrity="sha512-/FHUK/LsH78K9XTqsR9hbzr21J8B8RwHR/r8Jv9fzry6NVAOVIGFKQCNINsbhK7a1xubVu2r5QZcz2T9cKpubw==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        <style>{`
          .ql-editor audio,
          .custom-audio-player {
            display: block;
            margin: 10px 0;
            max-width: 100%;
            width: 100%;
            max-width: 500px;
          }
          .ql-editor video {
            display: block;
            margin: 10px 0;
            max-width: 100%;
          }
        `}</style>
      </Head>
      <Script
        src='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js'
        onLoad={highlight}
      />
      <div className={'post-page-view h-full flex flex-col'}>
        <div className="min-w-0 xl:grid xl:grid-cols-[minmax(0,1fr)_16rem] xl:gap-12">
          <div className="post-reading-column ql-snow min-w-0">
            <div className="post-sticky-bar py-3 h-16 sticky top-0 z-20 bg-canvas dark:bg-surface-dark border-b border-hairline dark:border-surface-dark-elevated">
              <Link
                href="/"
                className="border border-hairline dark:border-surface-dark-elevated hover:border-primary dark:hover:border-primary rounded-full inline-flex items-center justify-center cursor-pointer w-9 h-9 transition-colors duration-200"
              >
                <Image priority width={36} height={36} src="/icons/left_arrow.svg" alt="left" />
              </Link>
            </div>
            <h1 className="post-title font-display flex text-[2rem] md:text-[2.75rem] font-normal -ml-2 pb-2 text-ink dark:text-on-dark leading-[1.15] tracking-tight">
              {post.title}
            </h1>
            <p className="pl-1.5 font-body text-xs uppercase tracking-widest text-muted dark:text-muted-soft font-medium mb-3">
              {timeFromNow(post.updatedAt)} · {minutes} phút đọc
            </p>
            <PostToc toc={toc} variant="details" />
            <article className="pb-5 post-content ql-editor font-body text-body dark:text-on-dark-soft leading-relaxed" dangerouslySetInnerHTML={{ __html: post.publishContent || '' }} />
          </div>
          {toc.length + post.tags.length + latest.length > 0 && (
            <aside className="hidden xl:block">
              <ReadingRail
                toc={toc}
                minutes={minutes}
                updatedAt={post.updatedAt}
                tags={post.tags || []}
                latest={latest}
              />
            </aside>
          )}
        </div>
        <ClapButton postUid={post.uid} />
        <CommentSection postUid={post.uid} />
      </div>
    </>
  )
}

export async function getStaticPaths() {
  if (isNextProductionBuild()) {
    // CI has no seeded D1 at build time; blocking fallback prerenders each
    // post on the Worker on first request.
    return { paths: [], fallback: 'blocking' as const };
  }
  const posts = await getPublishedPostPaths();
  const paths = posts.map((post) => {
    const slug = `${friendlyStr(post.title)}.${post.uid}`;
    return { params: { slug } };
  });
  return {
    paths,
    fallback: 'blocking'
  }
}

// Run on server side
export const getStaticProps = async ({ params }: any) => {
  if (typeof params?.slug != 'string') return { notFound: true };
  const id = params.slug.split(".").pop() || "";
  const post = await getPostById(id) as Post;
  if (!post?.uid || !post.isPublished) {
    return { notFound: true, revalidate: 60 };
  }
  const { html, toc, minutes } = buildToc(post.publishContent || '');
  const latest = await getLatestPosts(3, post.uid);
  return {
    props: {
      post: { ...post, publishContent: html },
      toc,
      minutes,
      latest,
    },
    // Post pages are read-mostly; cache at the edge for 10 minutes,
    // serve stale up to 24 h. A thrown D1 error keeps the previous page
    // instead of caching an empty one. Edits land within this window.
    revalidate: 600,
  };
}

export default PostPage;
