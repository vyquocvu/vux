import * as React from 'react';
import Link from 'next/link';
import Image from "next/image";
import { NextPageContext } from 'next';

import { Post } from 'interfaces/Post';
import { timeFromNow } from 'utils/common';
import { getPostById } from "fetcher/post";

const PostPage = (props: { post: Post }) => {
  const { post } = props;

  if (!post.uid) return 'Không tìm thấy bài viết';
  return (
    <div className='post-page-view h-full w-full flex'>
      <div className="mx-4 w-full pt-16">
        <div className="w-full py-3 h-16 -ml-6 fixed bg-white top-0">
          <Link href="/" >
            <a className="border border-solid border-black rounded-full inline-block cursor-pointer w-10 h-10" >
              <Image width={40} height={40} src="/icons/left_arrow.svg" alt="left" />
            </a>
          </Link>
        </div>
        <h1 className="post-title text-2xl font-bold ml-0 pb-1"
          >{ post.title }</h1>
        <p> {timeFromNow(post.updatedAt.seconds)}</p>
        <div className="pb-5 post-content" dangerouslySetInnerHTML={{ __html: post.publishContent || '' }} />
      </div>
    </div>
  )
}

// Run on server side
PostPage.getInitialProps = async ({ query }: NextPageContext) => {
  try {
    if (typeof query.slug != 'string') return {};
    const id = query.slug.split(".").pop() || "";
    const post = await getPostById(id);
    return { post };
  } catch (error) {
    return {};
  }
}

export default PostPage;
