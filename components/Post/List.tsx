import * as React from 'react'
import Link from 'next/link';
import PostItem from './PostItem'
import { Post } from 'interfaces/Post'


type Props = {
  items: Post[],
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
    <Link href="/admin/post/new" >
      <a> New Post </a>
    </Link>
  </div>
  )
}

export default List
