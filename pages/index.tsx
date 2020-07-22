import React from 'react';

import Sidebar from 'components/Sidebar';
import PostList from 'components/Post/List';
import MainContent from 'components/MainContent';

import { Post } from 'interfaces/Post';
import { getPosts } from 'fetcher/post';
import { AuthInterface } from 'interfaces/User'

type Props = {
  AuthUserInfo: AuthInterface,
  posts: Post[]
}

const Index = (props: Props) => {
  const { posts } = props;
  return (
    <>
      <Sidebar />
      <MainContent>
        <PostList items={posts} />
      </MainContent>
    </>
  )
};

Index.getInitialProps = async () => {
  try {
    const posts = await getPosts();
    return { posts };
  } catch (error) {
    return {};
  }
}

export default Index;
