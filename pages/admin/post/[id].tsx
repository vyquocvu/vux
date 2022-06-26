
import React, { useEffect, useCallback, useState } from "react";
import get from 'lodash/get';
import Link from "next/link";
import Image from "next/image";
import { useRouter } from 'next/router';
import { useToasts } from 'react-toast-notifications';

import { Post } from "interfaces/Post";
import { getPostById, setPostById } from "fetcher/post";

import Loading from 'components/shared/Loading';
import PostEditor from 'components/Admin/PostEditor';
import withAuthUser from "utils/pageWrappers/withAuthUser";
import withAuthUserInfo from "utils/pageWrappers/withAuthUserInfo";

const PostPage = (props :any) => {
  const router = useRouter();
  const { AuthUserInfo } = props;
  const authUser = get(AuthUserInfo, "AuthUser");
  const [isLoaded, setIsLoaded] = useState(false);
  const { addToast } = useToasts();
  const [post, setPost] = useState<any>({});

  useEffect(() => {
    if (typeof window !== undefined && !authUser) {
      router.push("/login");
    }
  }, []);

  const fetchingPost = useCallback(async id => {
    try {
      const postDoc : Post = await getPostById(id, true) as Post;
      if (postDoc.uid) setPost({ ...postDoc });
      setIsLoaded(true);
    } catch (error) {};
  }, []);

  const onSubmit = async (postData: any) => {
    try {
      setIsLoaded(false);
      if (postData.isPublished) {
        postData.publishContent = postData.draffContent;
      }
      await setPostById(postData.uid, postData);
      addToast('Save post successfully!', { appearance: 'success', autoDismiss: true });
      setPost({ ...post, ...postData });
      if (postData.isPublished) {
        setTimeout(() => router.push('/admin'), 1000);
      } else {
        setIsLoaded(true);
      }
    } catch (error) {
      addToast('Save post Fail!', { appearance: 'error', autoDismiss: true });
    }
  };

  useEffect(() => {
    router.query.id ? fetchingPost(router.query.id) : '';
  }, [router.query]);

  if (typeof window === undefined) return null;

  return (
    <div className="post-page-view">
      <div className="w-full p-6 h-24">
        <Link href="/admin" >
          <a className="border-solid border border-black rounded-full inline-block cursor-pointer w-10 h-10" >
            <Image width={40} height={40} src="/icons/left_arrow.svg" alt="left" />
          </a>
        </Link>
      </div>
      <div className="m-auto py-6 px-4">
        {
          !isLoaded ? <Loading /> : (
            <>
              <h2 className="flex w-9/12 mx-auto"> Edit Post</h2>
              <PostEditor post={post} onSubmit={onSubmit} />
            </>
          )
        }
      </div>
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
