import React from "react";

import Sidebar from '../components/Sidebar';
import PostList from '../components/Post/List';
import MainContent from '../components/MainContent';
import { getPosts } from '../fetcher/post';
import { Post } from "interfaces/Post";

type Props = {
  AuthUserInfo: {
    AuthUser: {
      id: string,
      email: string,
      emailVerified: boolean,
    },
    token: string
  },
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

Index.defaultProps = {
  AuthUserInfo: null,
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
