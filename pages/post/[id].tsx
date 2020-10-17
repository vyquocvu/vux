
import * as React from 'react';
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
      <div className="header">
        <a onClick={router.back} className="back-icon-link w-inline-block" >
          <img width="25" src="/icons/left_arrow.svg" alt="left" />
        </a>
      </div>
      <div className="post-detail-container">
        <h1 className="post-title" >{ post.title }</h1>
        <p> {timeFromNow(post.updatedAt.seconds)}</p>
        <div dangerouslySetInnerHTML={{ __html: post.publishContent || '' }} />
      </div>
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
