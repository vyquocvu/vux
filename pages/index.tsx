import React from "react";
import firebase from "firebase/app";
import "firebase/firestore";
import PropTypes, { any } from "prop-types";
import initFirebase from "../utils/auth/initFirebase";

import withAuthUser from "../utils/pageWrappers/withAuthUser";
import withAuthUserInfo from "../utils/pageWrappers/withAuthUserInfo";

import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import PostList from '../components/Post/List';

initFirebase();

const mock = [
  { id: '1', name: 'Coffee variety macchiato as organic',
    content: 'Saucer, crema carajillo, bar, mocha medium, latte cappuccino and espresso acerbic to go. Coffee, irish foam turkish coffee blue mountain seasonal. Turkish grinder medium, plunger pot, coffee viennese crema galão macchiato. Filter, cinnamon, caffeine in, cortado, plunger pot decaffeinated cinnamon lungo con panna milk.' },
    { id: '2', name: 'Coffee variety macchiato as organic',
    content: 'Saucer, crema carajillo, bar, mocha medium, latte cappuccino and espresso acerbic to go. Coffee, irish foam turkish coffee blue mountain seasonal. Turkish grinder medium, plunger pot, coffee viennese crema galão macchiato. Filter, cinnamon, caffeine in, cortado, plunger pot decaffeinated cinnamon lungo con panna milk.' },
    { id: '3', name: 'Coffee variety macchiato as organic',
    content: 'Saucer, crema carajillo, bar, mocha medium, latte cappuccino and espresso acerbic to go. Coffee, irish foam turkish coffee blue mountain seasonal. Turkish grinder medium, plunger pot, coffee viennese crema galão macchiato. Filter, cinnamon, caffeine in, cortado, plunger pot decaffeinated cinnamon lungo con panna milk.' },
    { id: '4', name: 'Coffee variety macchiato as organic',
    content: 'Saucer, crema carajillo, bar, mocha medium, latte cappuccino and espresso acerbic to go. Coffee, irish foam turkish coffee blue mountain seasonal. Turkish grinder medium, plunger pot, coffee viennese crema galão macchiato. Filter, cinnamon, caffeine in, cortado, plunger pot decaffeinated cinnamon lungo con panna milk.' },
    { id: '5', name: 'Coffee variety macchiato as organic',
    content: 'Saucer, crema carajillo, bar, mocha medium, latte cappuccino and espresso acerbic to go. Coffee, irish foam turkish coffee blue mountain seasonal. Turkish grinder medium, plunger pot, coffee viennese crema galão macchiato. Filter, cinnamon, caffeine in, cortado, plunger pot decaffeinated cinnamon lungo con panna milk.' },
    { id: '6', name: 'Coffee variety macchiato as organic',
    content: 'Saucer, crema carajillo, bar, mocha medium, latte cappuccino and espresso acerbic to go. Coffee, irish foam turkish coffee blue mountain seasonal. Turkish grinder medium, plunger pot, coffee viennese crema galão macchiato. Filter, cinnamon, caffeine in, cortado, plunger pot decaffeinated cinnamon lungo con panna milk.' }
  ]


const Index = (props: any) => {
  return (
    <>
      <Sidebar />
      <MainContent>
        <PostList items={mock}/>
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

export default withAuthUser(withAuthUserInfo(Index));
