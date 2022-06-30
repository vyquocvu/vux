
import * as React from 'react';
import Image from "next/image";
import { useRouter } from "next/router";
import { NextPageContext } from 'next';

import { Post } from 'interfaces/Post';
import { getPostById } from "fetcher/post";
import { timeFromNow } from 'utils/common';
import Sidebar from 'components/Sidebar';


const PostPage = (props: { post: Post }) => {
  const { post } = props;
  const router = useRouter();

  if (!post.uid) return 'Không tìm thấy bài viết';
  return (
    <div className='post-page-view h-full w-screen flex'>
      <div className='h-screen xs:w-0 xs:p-0 md:w-64 md:min-w-[256px]'>
        <Sidebar />
      </div>
      <div className="mx-4">
        <div className="w-full py-6 h-24">
          <a onClick={router.back} className="border border-solid border-black rounded-full inline-block cursor-pointer w-10 h-10" >
            <Image width={40} height={40} src="/icons/left_arrow.svg" alt="left" />
          </a>
        </div>
        <h1 className="post-title text-2xl font-bold ml-4 pb-1"
          >{ post.title }</h1>
        <p> {timeFromNow(post.updatedAt.seconds)}</p>
        <div dangerouslySetInnerHTML={{ __html: post.publishContent || '' }} />
      </div>
      <style >{`
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
    if (typeof query.slug != 'string') return {};
    const id = query.slug.split(".").pop() || "";
    const post = await getPostById(id);
    return { post };
  } catch (error) {
    return {};
  }
}

export default PostPage;
