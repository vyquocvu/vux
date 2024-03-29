import React from 'react';
import Head from 'next/head';
import Image from "next/image";
import Script from 'next/script';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';


import { Post } from 'interfaces/Post';
import { getPostById, getPublishedPosts } from "fetcher/post";
import { friendlyStr, highlight, timeFromNow } from 'utils/common';
import config from 'config';
import Link from 'next/link';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'applause-button': any
    }
  }
}

const PostPage = (props: { post: Post, host: string}) => {
  const { post } = props;
  const [pathname, setPathname] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    setPathname(location.pathname)
  }, []);

  if (!post?.uid) return 'Không tìm thấy bài viết';
  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta name="title" content={post.title} />
        <meta name="description" content={post.thumbText} />
        <meta name="keywords" content={config.keywords +", "+ post.tags?.join(",")} />
        <meta name="author" content="Vy Quốc Vũ" />
        {/* Open Graph / Facebook  */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={config.host} />
        <meta property="og:title" content={post.title}/>
        <meta property="og:description" content={post.thumbText}/>
        <meta property="og:image" content={post.thumbImage || config.avatar}/>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.snow.min.css" integrity="sha512-/FHUK/LsH78K9XTqsR9hbzr21J8B8RwHR/r8Jv9fzry6NVAOVIGFKQCNINsbhK7a1xubVu2r5QZcz2T9cKpubw==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        <link rel="stylesheet" href="https://unpkg.com/applause-button/dist/applause-button.css" />

      </Head>
      <Script src="https://unpkg.com/applause-button/dist/applause-button.js" />
      <Script
        src='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js'
        onLoad={highlight}
      />
      <div className={'post-page-view h-full md:w-full flex flex-col'}>
        <div className="md:mx-4 w-full pt-12 ql-snow">
          <div className="w-full py-3 h-16 -ml-6 fixed bg-white top-0">
            {/* <--! Back button --> */}
            <Link href="/" className="border border-solid border-black rounded-full inline-block cursor-pointer w-10 h-10" >
              <Image priority width={40} height={40} src="/icons/left_arrow.svg" alt="left" />
            </Link>
          </div>
          <h1 className="post-title flex text-4xl font-medium -ml-2 pb-1">{ post.title }</h1>
          <p className="pl-1.5"> {timeFromNow(post.updatedAt.seconds)}</p>
          <div className="pb-5 post-content ql-editor pl-1.5" dangerouslySetInnerHTML={{ __html: post.publishContent || '' }} />
        </div>
        <div className="fixed w-13 h-13 right-2 bottom-2 bg-white rounded-full	">
          <applause-button url={pathname} multiclap="true" style={{ width: 48, height: 48 }} />
        </div>
        <hr className='text-lg mt-4 ml-4 w-full'/>
        <h2 className='text-lg m-4 font-normal'>Comments</h2>

        <div
          id="cusdis_thread"
          className="ml-3 mt-3 w-full"
          data-page-id={post.uid}
          data-page-url={pathname}
          data-page-title={post.title}
          data-host="https://cusdis.com"
          data-app-id="e2a6f339-0f07-48c1-8a25-b6ef4820ffa8"
        >
        </div>
        <Script async src="https://cusdis.com/js/cusdis.es.js" />
      </div>
    </>
  )
}

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
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
  try {
    if (typeof params.slug != 'string') return {};
    const id = params.slug.split(".").pop() || "";
    const post = await getPostById(id);
    post.createdAt = post.createdAt.toJSON();
    post.updatedAt = post.updatedAt.toJSON();
    return { 
      props: {
        post, 
      },
      revalidate: 60 * 60,
    };
  } catch (error) {
    return {
      props: {}
    };
  }
}

export default PostPage;
