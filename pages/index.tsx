import React from "react";
import "firebase/firestore";
import PropTypes from "prop-types";
import firebase from "firebase/app";

import initFirebase from "../utils/auth/initFirebase";

import Sidebar from '../components/Sidebar';
import PostList from '../components/Post/List';
import MainContent from '../components/MainContent';

initFirebase();

const Index = (props: any) => {
  const { posts } = props;
  return (
    <>
      <Sidebar />
      <MainContent>
        <PostList items={posts} />
      </MainContent>
    </>
  )
};

Index.propTypes = {
  AuthUserInfo: PropTypes.shape({
    AuthUser: PropTypes.shape({
      id: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      emailVerified: PropTypes.bool.isRequired
    }),
    token: PropTypes.string
  })
};

Index.defaultProps = {
  AuthUserInfo: null,
};

Index.getInitialProps = async () => {
  try {
    const db = firebase.firestore();
    const postRepo = await db.collection("posts").get();
    const posts = postRepo.docs.map((sp) => ({...sp.data(), uid: sp.id }));
    return { posts };
  } catch (error) {
    return {};
  }
}

export default Index;
