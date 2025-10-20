import dynamic from "next/dynamic";
import { useRouter } from 'next/router';
import { useEffect, useState } from "react";
import { useToasts } from 'react-toast-notifications';

import { get } from 'utils/common';
import { addPost } from "fetcher/post";

import withAuthUser from "utils/pageWrappers/withAuthUser";
import withAuthUserInfo from "utils/pageWrappers/withAuthUserInfo";

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
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.snow.min.css" integrity="sha512-/FHUK/LsH78K9XTqsR9hbzr21J8B8RwHR/r8Jv9fzry6NVAOVIGFKQCNINsbhK7a1xubVu2r5QZcz2T9cKpubw==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quill-image-resize-module@3.0.0/image-resize.min.css" />
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
