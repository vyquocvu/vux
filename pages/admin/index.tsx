import React, { useEffect, useCallback, useState } from "react";
import get from 'lodash/get';
import { useRouter } from 'next/router';
import Sidebar from 'components/Sidebar';
import PostList from 'components/Post/List';
import Loading from 'components/shared/Loading';
import MainContent from 'components/MainContent';

import { Post } from "interfaces/Post";
import { AuthInterface } from "interfaces/User";
import { getPostsByUserId } from 'fetcher/post';
import withAuthUser from "utils/pageWrappers/withAuthUser";
import withAuthUserInfo from "utils/pageWrappers/withAuthUserInfo";

type Props = {
  AuthUserInfo: AuthInterface
};

const AdminPage = (props: Props) => {
  const { AuthUserInfo } = props;
  const [posts, setPosts] = useState([] as any);
  const [isLoaded, setIsLoaded] = useState(false);

  const router = useRouter();
  const authUser = get(AuthUserInfo, "AuthUser");

  const fetchingPosts = useCallback(async () => {
    try {
      const docs : [Post] = await getPostsByUserId(authUser.id) as any;
      setPosts(docs);
      setIsLoaded(true);
    } catch (error) {}
  }, []);

  useEffect(() => {
    if (typeof window !== undefined && !authUser) {
      router.push("/login");
    } else {
      fetchingPosts();
    }
  }, []);

  return (
    <div className="list-post">
      <Sidebar />
      <MainContent>
        { !isLoaded ? <Loading /> : <PostList items={posts} isAdmin /> }
      </MainContent>
    </div>
  );
}

AdminPage.getInitialProps = (ctx: any) => {
  const token = get(ctx, 'myCustomData.AuthUserInfo.token');
  if (!token && ctx.res) ctx.res.writeHead(302, { Location: '/login' }).end();
  return {};
}

export default withAuthUser(withAuthUserInfo(AdminPage));
