import React, { useEffect, useCallback, useState } from "react";
import Router from "next/router";
import get from 'lodash/get';
import Sidebar from 'components/Sidebar';
import PostList from 'components/Post/List';
import MainContent from 'components/MainContent';

import { Post } from "interfaces/Post";
import { AuthInterface } from "interfaces/User";
import { getPosts } from 'fetcher/post';
import withAuthUser from "utils/pageWrappers/withAuthUser";
import withAuthUserInfo from "utils/pageWrappers/withAuthUserInfo";

type Props = {
  AuthUserInfo: AuthInterface
};

const AdminPage = (props: Props) => {
  const { AuthUserInfo } = props;
  const [posts, setPosts] = useState([] as any);
  const authUser = get(AuthUserInfo, "AuthUser");

  const fetchingPosts = useCallback(async () => {
    try {
      const docs : [Post] = await getPosts() as any;
      setPosts(docs);
    } catch (error) {}
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

export default withAuthUser(withAuthUserInfo(AdminPage));
