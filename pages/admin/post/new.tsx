import dynamic from "next/dynamic";
import { useRouter } from 'next/router';
import { useEffect, useState } from "react";
import { useToasts } from 'react-toast-notifications';

import { get } from 'utils/common';
import { addPost } from "fetcher/post";

import withAuthUser from "utils/pageWrappers/withAuthUser";
import withAuthUserInfo from "utils/pageWrappers/withAuthUserInfo";
import QuillStyles from "components/Admin/QuillStyles";

const PostEditor = dynamic(import('components/Admin/PostEditor'), { ssr: false });

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
    if (!authUser) {
      router.push("/login");
    }
  }, [authUser, router]);

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

  return (
    <div className="m-auto py-6 px-4">
      <QuillStyles />
      <h2> Create new Post </h2>
      <PostEditor post={post} onSubmit={onSubmit} />
    </div>
  );
}

PostPage.getInitialProps = (ctx: any) => {
  const token = get(ctx, 'myCustomData.AuthUserInfo.token');
  if (!token && ctx.res) {
    ctx.res.writeHead(302, { Location: '/login' }).end();
  }
  return {};
}

export default withAuthUser(withAuthUserInfo(PostPage));
