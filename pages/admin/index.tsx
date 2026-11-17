import { useEffect, useCallback, useState } from "react";
import {get} from 'utils/common';
import { useRouter } from 'next/router';
import PostList from 'components/Post/List';
import Loading from 'components/shared/Loading';

import { Post } from "interfaces/Post";
import { AuthInterface } from "utils/auth/user";
import withAuthUser from "utils/pageWrappers/withAuthUser";
import withAuthUserInfo from "utils/pageWrappers/withAuthUserInfo";

type Props = {
  AuthUserInfo: AuthInterface
};

const AdminPage = (props: Props) => {
  const router = useRouter();
  const { AuthUserInfo } = props;
  const [posts, setPosts] = useState([] as any);
  const [isLoaded, setIsLoaded] = useState(false);

  const authUser = get(AuthUserInfo, "AuthUser");

  const fetchingPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/posts", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Fetch failed");
      const data = (await res.json()) as { posts?: Post[] };
      setPosts(data.posts ?? []);
      setIsLoaded(true);
    } catch {
      setPosts([]);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !authUser?.isAdmin) {
      router.push(authUser ? "/" : "/login");
    } else {
      fetchingPosts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="admin pb-14">
      { !isLoaded ? <Loading /> : <PostList items={posts} isAdmin /> }
    </div>
  );
}

AdminPage.getInitialProps = (ctx: any) => {
  const info = get(ctx, "myCustomData.AuthUserInfo");
  if (!info?.AuthUser?.isAdmin && ctx.res) {
    ctx.res.writeHead(302, { Location: info?.token ? "/" : "/login" }).end();
  }
  return {};
}

export default withAuthUser(withAuthUserInfo(AdminPage));
