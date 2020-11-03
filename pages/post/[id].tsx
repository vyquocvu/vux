
import * as React from 'react';
import Image from "next/image";
import { useRouter } from "next/router";
import { NextPageContext } from 'next';

import { Post } from 'interfaces/Post';
import { getPostById } from "fetcher/post";
import { timeFromNow } from 'utils/common';


const PostPage = (props: { post: Post }) => {
  const { post } = props;
  const router = useRouter();

  if (!post.uid) return 'Không tìm thấy bài viết';
  return (
    <div className='post-page-view'>
      <div className="w-full p-6 h-24">
        <a onClick={router.back} className="border-solid border border-black rounded-full inline-block cursor-pointer" >
          <Image width={40} height={40} src="/icons/left_arrow.svg" alt="left" />
        </a>
      </div>
      <div className="max-w-2xl max-w-xs px-6 m-auto">
        <h1 className="post-title text-2xl font-bold -ml-1 pb-1"
          >{ post.title }</h1>
        <p> {timeFromNow(post.updatedAt.seconds)}</p>
        <div dangerouslySetInnerHTML={{ __html: post.publishContent || '' }} />
      </div>
      <style jsx >{`
        .post-title::before {
          content: "#";
          color: #CCC;
          margin-right: 8px;
          margin-left: -20px;
          font-weight: normal;
        }
    `}</style>
    </div>
  )
}

// Run on server side
PostPage.getInitialProps = async ({ query }: NextPageContext) => {
  try {
    if (typeof query.id != 'string') return {};
    const post = await getPostById(query.id);
    return { post };
  } catch (error) {
    return {};
  }
}

export default PostPage;
