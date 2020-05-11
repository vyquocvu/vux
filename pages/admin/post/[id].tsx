
import React, { useEffect, useCallback, useState } from "react";
import { useRouter } from 'next/router'

import PostEditor from '~components/Admin/PostEditor';

import initFirebase from "../../../utils/auth/initFirebase";

import firebase from "firebase/app";
import "firebase/firestore";

const postMetaData = {
  url: '',
  tags: [],
  title: '',
  createdAt: '',
  updatedAt: '',
  thumbImage: '',
  thumbText: '',
  status: '',
  content: {
    title: '',
    text: '',
  }
}

initFirebase();

export default function ({ }) {
  const [post, setPost] = useState<any>({});
  const router = useRouter();

  const fetchingPost = useCallback(async id => {
    const db = firebase.firestore();
    try {
      const postDoc = await db.collection("posts").doc(id).get();
      if (postDoc.exists) setPost({...postDoc.data(), uid: postDoc.id });
    } catch (error) {}
  }, []);

  useEffect(() => {
    const { id } = router.query;
    id ? fetchingPost(id) : '';
  }, [router.query]);

  return (typeof window === undefined) ? <div /> : <PostEditor post={post} />;
}
