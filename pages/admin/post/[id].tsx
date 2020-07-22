
import React, { useEffect, useCallback, useState } from "react";
import { useToasts } from 'react-toast-notifications'
import { useRouter } from 'next/router'

import { Post } from "interfaces/Post";
import { getPostById, setPostById } from "fetcher/post";

import PostEditor from 'components/Admin/PostEditor';
import withAuthUser from "utils/pageWrappers/withAuthUser";
import withAuthUserInfo from "utils/pageWrappers/withAuthUserInfo";

const PostPage = (props :any) => {
  console.log('props', props);
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

export default withAuthUser(withAuthUserInfo(PostPage));
;
