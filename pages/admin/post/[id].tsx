
import React, { useEffect, useCallback, useState } from "react";
import { useToasts } from 'react-toast-notifications'
import { useRouter } from 'next/router'

import PostEditor from '~components/Admin/PostEditor';
import { getPostById, setPostById } from "../../../fetcher/post";
import { Post } from "interfaces/Post";


const PostPage = ({}) => {
  const [post, setPost] = useState<any>({});
  const router = useRouter();
  const { addToast } = useToasts();

  const fetchingPost = useCallback(async id => {
    try {
      const postDoc : Post = await getPostById(id) as any;
      if (postDoc.uid) setPost({ ...postDoc });
    } catch (error) {};
  }, []);

  const onSubmit = async (postData: any) => {
    const id = post.uid;
    try {
      await setPostById(id, postData);
      addToast('Save post successfully!', { appearance: 'success', autoDismiss: true });
    } catch (error) {
      addToast('Save post Fail!', { appearance: 'error', autoDismiss: true });
    }
  };

  useEffect(() => {
    router.query.id ? fetchingPost(router.query.id) : '';
  }, [router.query]);

  return (typeof window !== undefined) ? (
    <div>
      <PostEditor post={post} onSubmit={onSubmit} />
    </div>
  ) : null;
}

PostPage.getInitialProps = async () => ({});

export default PostPage;
