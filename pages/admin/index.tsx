import React, { useEffect } from "react";
import Router from "next/router";
import get from 'lodash/get'
import Sidebar from '../../components/Sidebar'
import MainContent from '../../components/MainContent'
import PostList from '../../components/Post/List'
import withAuthUser from "../../utils/pageWrappers/withAuthUser";
import withAuthUserInfo from "../../utils/pageWrappers/withAuthUserInfo";


const mock = [
  { id: '1', name: 'Coffee variety macchiato as organic',
    content: 'Saucer, crema carajillo, bar, mocha medium, latte cappuccino and espresso acerbic to go. Coffee, irish foam turkish coffee blue mountain seasonal. Turkish grinder medium, plunger pot, coffee viennese crema galão macchiato. Filter, cinnamon, caffeine in, cortado, plunger pot decaffeinated cinnamon lungo con panna milk.' },
    { id: '1', name: 'Coffee variety macchiato as organic',
    content: 'Saucer, crema carajillo, bar, mocha medium, latte cappuccino and espresso acerbic to go. Coffee, irish foam turkish coffee blue mountain seasonal. Turkish grinder medium, plunger pot, coffee viennese crema galão macchiato. Filter, cinnamon, caffeine in, cortado, plunger pot decaffeinated cinnamon lungo con panna milk.' },
    { id: '1', name: 'Coffee variety macchiato as organic',
    content: 'Saucer, crema carajillo, bar, mocha medium, latte cappuccino and espresso acerbic to go. Coffee, irish foam turkish coffee blue mountain seasonal. Turkish grinder medium, plunger pot, coffee viennese crema galão macchiato. Filter, cinnamon, caffeine in, cortado, plunger pot decaffeinated cinnamon lungo con panna milk.' },
    { id: '1', name: 'Coffee variety macchiato as organic',
    content: 'Saucer, crema carajillo, bar, mocha medium, latte cappuccino and espresso acerbic to go. Coffee, irish foam turkish coffee blue mountain seasonal. Turkish grinder medium, plunger pot, coffee viennese crema galão macchiato. Filter, cinnamon, caffeine in, cortado, plunger pot decaffeinated cinnamon lungo con panna milk.' },
    { id: '1', name: 'Coffee variety macchiato as organic',
    content: 'Saucer, crema carajillo, bar, mocha medium, latte cappuccino and espresso acerbic to go. Coffee, irish foam turkish coffee blue mountain seasonal. Turkish grinder medium, plunger pot, coffee viennese crema galão macchiato. Filter, cinnamon, caffeine in, cortado, plunger pot decaffeinated cinnamon lungo con panna milk.' },
    { id: '1', name: 'Coffee variety macchiato as organic',
    content: 'Saucer, crema carajillo, bar, mocha medium, latte cappuccino and espresso acerbic to go. Coffee, irish foam turkish coffee blue mountain seasonal. Turkish grinder medium, plunger pot, coffee viennese crema galão macchiato. Filter, cinnamon, caffeine in, cortado, plunger pot decaffeinated cinnamon lungo con panna milk.' }
  ]

const PostsPage = (props: any) => {
  console.log('props', props);
  const { AuthUserInfo } = props;
  const authUser = get(AuthUserInfo, "AuthUser");

  useEffect(() => {
    if (!authUser) {
      Router.push("/login");
    }
  });
  return (
    <>
      <Sidebar />
      <MainContent>
        <PostList items={mock}/>
      </MainContent>
    </>
  )
}

export default withAuthUser(withAuthUserInfo(PostsPage));
