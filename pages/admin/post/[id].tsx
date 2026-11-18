
import { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

import { get } from 'utils/common';
import { useRouter } from 'next/router';
import { useToasts } from 'react-toast-notifications';

import { Post } from "interfaces/Post";
import { AuthInterface } from "utils/auth/user";

import Loading from 'components/shared/Loading';
import withAuthUser from "utils/pageWrappers/withAuthUser";
import withAuthUserInfo from "utils/pageWrappers/withAuthUserInfo";
import QuillStyles from "components/Admin/QuillStyles";

const PostEditor = dynamic(import('components/Admin/PostEditor'), { ssr: false });

interface PostPageProps {
  AuthUserInfo: AuthInterface;
}

const PostPage = (props: PostPageProps) => {
  const router = useRouter();
  const { AuthUserInfo } = props;
  const authUser = get(AuthUserInfo, "AuthUser");
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToasts();
  const [post, setPost] = useState<Post | Record<string, never>>({});
  useEffect(() => {
    if (typeof window !== 'undefined' && !authUser?.isAdmin) {
      router.push(authUser ? "/" : "/login");
    }
  }, [authUser, router]);

  const fetchingPost = useCallback(async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(`Không tải được bài viết (HTTP ${res.status}).`);
      const postDoc: Post = (await res.json()) as Post;
      if (!postDoc?.uid) throw new Error("Không tìm thấy bài viết.");
      setPost({ ...postDoc });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được bài viết.");
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const onSubmit = async (postData: Post) => {
    try {
      setIsLoaded(false);
      if (postData.isPublished) {
        postData.publishContent = postData.draftContent;
      }
      const res = await fetch(`/api/admin/posts/${postData.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(postData),
      });
      if (!res.ok) throw new Error("Save failed");
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
    if (router.query.id) {
      const id = String(router.query.id).split(".").pop();
      fetchingPost(id || '');
    }
  }, [fetchingPost, router.query]);


  return (
    <div className="post-page-view">
      <QuillStyles />
      <div className="w-full">
        <Link href="/" className="border-solid border border-black rounded-full inline-block cursor-pointer w-10 h-10" >
          <Image priority width={40} height={40} src="/icons/left_arrow.svg" alt="left" />
        </Link>
      </div>
      <div className="m-auto py-6 px-4">
        {
          !isLoaded ? <Loading /> : error ? (
            <div className="flex xl:w-9/12 mx-auto flex-col items-start gap-3">
              <h2 className="text-lg font-medium">Không tải được nội dung</h2>
              <p className="text-sm text-gray-700">{error}</p>
              <button
                className="bg-blue-500 shadow-xs px-3 py-1 text-white rounded"
                onClick={() => {
                  const raw = router.query.id;
                  const id = raw ? String(raw).split(".").pop() || "" : "";
                  fetchingPost(id);
                }}
              >
                Thử lại
              </button>
            </div>
          ) : (
            <>
              <h2 className="flex xl:w-9/12 mx-auto"> Edit Post</h2>
              <PostEditor post={post} onSubmit={onSubmit} />
            </>
          )
        }
      </div>
    </div>
  );
}

PostPage.getInitialProps = (ctx: any) => {
  const info = get(ctx, "myCustomData.AuthUserInfo");
  if (!info?.AuthUser?.isAdmin && ctx.res) {
    ctx.res.writeHead(302, { Location: info?.token ? "/" : "/login" }).end();
  }
  return {};
}

export default withAuthUser(withAuthUserInfo(PostPage));
