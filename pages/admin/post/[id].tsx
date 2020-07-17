
import React, { useEffect, useCallback, useState } from "react";
import { useToasts } from 'react-toast-notifications'
import { useRouter } from 'next/router'

import PostEditor from '~components/Admin/PostEditor';
import initFirebase from "../../../utils/auth/initFirebase";

import firebase from "firebase/app";
import "firebase/firestore";

initFirebase();
const db = firebase.firestore();
const PostCollection = db.collection("posts");

const PostPage = ({}) => {
  const [post, setPost] = useState<any>({});
  const router = useRouter();
  const { addToast } = useToasts();

  const fetchingPost = useCallback(async id => {
    try {
      const postDoc = await PostCollection.doc(id).get();
      if (postDoc.exists) setPost({ ...postDoc.data(), uid: postDoc.id });
    } catch (error) {
      console.log('Error', error);
    };
  }, []);

  const onSubmit = useCallback(async (postData: any) => {
    const id = postData.uid;
    try {
      await PostCollection.doc(id).set(postData);
      addToast('Save post successfully!', { appearance: 'success', autoDismiss: true });
    } catch (error) {
      addToast('Save post Fail!', { appearance: 'error', autoDismiss: true });
    }
  }, []);

  useEffect(() => {
    router.query.id ? fetchingPost(router.query.id) : '';
  }, [router.query]);
  return (typeof window !== undefined) ? (
    <div>
      <PostEditor post={post} onSubmit={onSubmit} />
    </div>
  ) : '';
}

PostPage.getInitialProps = async () => ({});

export default PostPage;
