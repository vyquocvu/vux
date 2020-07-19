import React, { useEffect, useCallback, useState } from "react";
import Router from "next/router";
import get from 'lodash/get';
import Sidebar from '../../components/Sidebar';
import MainContent from '../../components/MainContent';
import PostList from '../../components/Post/List';

import { getPosts } from '../../fetcher/post';


import withAuthUser from "../../utils/pageWrappers/withAuthUser";
import withAuthUserInfo from "../../utils/pageWrappers/withAuthUserInfo";

const PostsPage = (props: any) => {
  const { AuthUserInfo } = props;
  const [posts, setPosts] = useState([]);
  const authUser = get(AuthUserInfo, "AuthUser");

  const fetchingPosts = useCallback(async () => {
    try {
      const docs = await getPosts();
      console.log('getPosts', docs);
      setPosts(docs);
    } catch (error) {
      console.log('error', error);
    }
  }, []);

  useEffect(() => {
    (!authUser) ? Router.push("/login") : fetchingPosts();
  }, []);
  return (
    <>
      <Sidebar />
      <MainContent>
        <PostList items={posts} isAdmin />
      </MainContent>
    </>
  )
}

export default withAuthUser(withAuthUserInfo(PostsPage));
