import Head from 'next/head';
import Image from "next/image";
import Script from 'next/script';
import { NextPageContext } from 'next';


import { Post } from 'interfaces/Post';
import { getPostById } from "fetcher/post";
import { highlight, timeFromNow } from 'utils/common';

const PostPage = (props: { post: Post, host: string, referer:  string}) => {
  const { post, host, referer } = props;

  const getBackUrl = () => {
    if (!referer) return "/";
    try {
      const url = new URL(referer);
      return url.pathname;
    } catch (error) {
      return "/";
    }
  }

  if (!post.uid) return 'Không tìm thấy bài viết';
  return (
    <>
      <Head>
        <meta name="title" content={post.title} />
        <meta name="description" content={post.thumbText} />
        <meta name="keywords" content="Vy Quốc Vũ, Blog, Notes, Developer" />
        <meta name="author" content="Vy Quốc Vũ" />
        {/* Open Graph / Facebook  */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={host} />
        <meta property="og:title" content={post.title}/>
        <meta property="og:description" content={post.thumbText}/>
        {post.thumbImage ?? <meta property="og:image" content={post.thumbImage}/>}
      </Head>
      <Script
        src='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js'
        onLoad={highlight}
      />
      <div className={'post-page-view h-full w-full flex'}>
        <div className="mx-4 w-full pt-16 ql-snow">
          <div className="w-full py-3 h-16 -ml-6 fixed bg-white top-0">
            {/* <--! Back button --> */}
            <a href={getBackUrl()} className="border border-solid border-black rounded-full inline-block cursor-pointer w-10 h-10" >
              <Image priority width={40} height={40} src="/icons/left_arrow.svg" alt="left" />
            </a>
          </div>
          <h1 className="post-title text-2xl font-bold ml-0 pb-1"
            >{ post.title }</h1>
          <p> {timeFromNow(post.updatedAt.seconds)}</p>
          <div className="pb-5 post-content ql-editor" dangerouslySetInnerHTML={{ __html: post.publishContent || '' }} />
        </div>
      </div>
    </>
  )
}

// Run on server side
PostPage.getInitialProps = async ({ query, req }: NextPageContext) => {
  try {
    if (typeof query.slug != 'string') return {};
    const id = query.slug.split(".").pop() || "";
    const post = await getPostById(id);
    let host = req?.headers?.host;
    return { post, host, referer: req?.headers.referer };
  } catch (error) {
    return {};
  }
}

export default PostPage;
