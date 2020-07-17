
import * as React from 'react';
import Link from 'next/link';
import firebase from "firebase/app";

import initFirebase from "../../utils/auth/initFirebase";
import { secondToDateString } from '../../utils/common';


initFirebase();

const PostDetail = (props) => {
  const { post } = props;
  console.log(props);
  return (
    <>
      <h1>{ post.title }</h1>
      <p> {}</p>
      <p>
        <Link href="/">
          <a>Go home</a>
        </Link>
      </p>
    </>
  )
}


// Run on server side
PostDetail.getInitialProps = async (ctx: any) => {
  if (!ctx.query.id) return {}
  try {
    const db = firebase.firestore();
    const postDoc = await db.collection("posts").doc(ctx.query.id).get();
    const post = postDoc.exists ? {...postDoc.data(), uid: postDoc.id } : {};
    return { post };
  } catch (error) {
    return {};
  }
}

export default PostDetail;