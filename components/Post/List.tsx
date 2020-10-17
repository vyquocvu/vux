import * as React from 'react';
import Link from 'next/link';
import PostItem from './PostItem';
import { Post, PostLite } from 'interfaces/Post';


type Props = {
  items: Post[] | PostLite[],
  isAdmin?: Boolean,
}



const List: React.FunctionComponent<Props> = ({ items = [], isAdmin = false }) => {
  const renderItem = (item: Post) => {
    if (!item.uid) return '';
    return <PostItem key={item.uid} data={item} isAdmin={isAdmin} />
  }
  return (
    <div>
    {(items as any[]).map((item: Post) => renderItem(item))}
    {isAdmin ? (
      <Link href="/admin/post/new" >
        <a className="button-round"> New Post </a>
      </Link>) : null}
  </div>
  )
}

export default List
