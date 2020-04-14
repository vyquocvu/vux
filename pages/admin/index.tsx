import * as React from 'react'
import Sidebar from '~components/Sidebar'
import MainContent from '~components/MainContent'
import PostList from '~components/Post/List'
import { NextPage } from 'next'


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

const PostsPage: NextPage = (listPost: [Object]) => {
  console.log('listPost', listPost);
  return (
    <>
      <Sidebar />
      <MainContent>
        <PostList items={mock}/>
      </MainContent>
    </>
  )
}

export default PostsPage