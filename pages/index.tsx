import React from 'react';
import dynamic from "next/dynamic";

import Head from "next/head";
const Sidebar = dynamic(() => import('components/Sidebar'));
const PostList = dynamic(() => import('components/Post/List'));
const MainContent = dynamic(() => import('components/MainContent'));

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
  return (
    <>
      <Head>
        <meta name="author" content={config.author} />
        <meta name="keywords" content={config.keywords} />
        <meta name="description" content={config.description}/>

        <meta name="og:title" content={config.title}/>
        <meta name="og:image" content={config.avatar}/>
        <meta name="og:description" content={config.description}/>
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
