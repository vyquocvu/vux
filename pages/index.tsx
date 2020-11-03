import React from 'react';
import dynamic from "next/dynamic";

import Head from "next/head";
const Sidebar = dynamic(() => import('components/Sidebar'));
const PostList = dynamic(() => import('components/Post/List'));
const MainContent = dynamic(() => import('components/MainContent'));

import { Post } from 'interfaces/Post';
import { AuthInterface } from 'interfaces/User'
import { getPublishedPosts } from 'fetcher/post';

type Props = {
  AuthUserInfo: AuthInterface,
  posts: Post[]
}

const Index = (props: Props) => {
  const { posts } = props;
  return (
    <>
      <Head>
        <meta name="description" content="Để ghi lại những gì đáng nhớ"/>
      </Head>
      <div className="">
        <Sidebar />
        <MainContent>
          <PostList items={posts} />
        </MainContent>
      </ div>
    </>
  )
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
