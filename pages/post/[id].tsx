
import * as React from 'react';
import Link from 'next/link';
import { NextPageContext } from 'next';

import { Post } from 'interfaces/Post';
import { getPostById } from "fetcher/post";
import { secondToDateString } from 'utils/common';


const PostPage = (props: { post: Post }) => {
  const { post } = props;
  if (!post.uid) return 'Không tìm thấy bài viết';
  return (
    <div className='post-page-view'>
      <div>
        <div className="header">
          <a href="/"><span className="avatar"></span></a>
        </div>
      </div>
      <div className="post-detail-container">
        <h1 className="post-title" >{ post.title }</h1>
        <p> {secondToDateString(post.updatedAt.seconds)}</p>
        <div dangerouslySetInnerHTML={{ __html: post.publishContent || '' }} />
        <p>
          <Link href="/">
            <a>Go home</a>
          </Link>
        </p>
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
