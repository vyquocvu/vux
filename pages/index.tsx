import React from 'react';
import dynamic from "next/dynamic";

const PostList = dynamic(() => import('components/Post/List'));

import config from 'config';
import { Post } from 'interfaces/Post';
import { AuthInterface } from 'interfaces/User'
import { getPublishedPosts } from 'fetcher/post';

type Props = {
  AuthUserInfo: AuthInterface,
  posts: Post[]
}

const Index = (props: Props) => {
  const { posts } = props;
  return <PostList items={posts} />;
};

Index.getInitialProps = async () => {
  try {
    const posts = await getPublishedPosts();
    return { posts };
  } catch (error) {
    return {};
  }
}

export default Index;
