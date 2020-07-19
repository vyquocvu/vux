import React from "react";
import PropTypes from "prop-types";

import Sidebar from '../components/Sidebar';
import PostList from '../components/Post/List';
import MainContent from '../components/MainContent';
import { getPosts } from '../fetcher/post';

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
    const posts = await getPosts();
    return { posts };
  } catch (error) {
    return {};
  }
}

export default Index;
