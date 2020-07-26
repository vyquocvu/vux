
import React, { useEffect, useState } from "react";
import get from 'lodash/get';
import { useRouter } from 'next/router';
import { useToasts } from 'react-toast-notifications';

import { addPost } from "fetcher/post";

import PostEditor from 'components/Admin/PostEditor';
import withAuthUser from "utils/pageWrappers/withAuthUser";
import withAuthUserInfo from "utils/pageWrappers/withAuthUserInfo";

const PostPage = (props :any) => {
  const { AuthUserInfo } = props;
  const authUser = get(AuthUserInfo, "AuthUser");
  const [post] = useState<any>({
    uid: 'creating-post',
    author: authUser.id
  });

  const router = useRouter();
  const { addToast } = useToasts();

  useEffect(() => {
    if (typeof window !== undefined && !authUser) {
      router.push("/login");
    }
  }, []);

  const onSubmit = async (postData: any) => {
    delete postData.uid;
    try {
      const newPost: any = await addPost(postData);
      addToast('Create post successfully!', { appearance: 'success', autoDismiss: true });
      router.push(`/admin/post/${newPost.uid}`);
    } catch (error) {
      addToast('Create post Fail!', { appearance: 'error', autoDismiss: true });
    }
  };

  return (typeof window !== undefined) ? (
    <div className="container">
      <h2>Create new Post </h2>
      <PostEditor post={post} onSubmit={onSubmit} />
    </div>
  ) : null;
}

PostPage.getInitialProps = (ctx: any) => {
  const token = get(ctx, 'myCustomData.AuthUserInfo.token');
  if (!token && ctx.res) {
    ctx.res.writeHead(302, { Location: '/login' }).end();
  }
  return {};
}

export default withAuthUser(withAuthUserInfo(PostPage));
