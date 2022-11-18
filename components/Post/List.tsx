import type { FunctionComponent } from 'react';
import Link from 'next/link';
import PostItem from './PostItem';
import { Post, PostLite } from 'interfaces/Post';


type Props = {
  items: Post[] | PostLite[],
  isAdmin?: boolean,
}

const List: FunctionComponent<Props> = ({ items = [], isAdmin = false }) => {
  const renderItem = (item: Post) => {
    if (!item.uid) return '';
    return <PostItem key={item.uid} data={item} isAdmin={isAdmin} />
  }
  return (
    <div>
    {(items as any[]).map((item: Post) => renderItem(item))}
    {isAdmin ? (
      <div className="mt-4 fixed bottom-0 w-full bg-white">
      <Link href="/admin/post/new" legacyBehavior>
        <a className="text-gray-900 text-sm my-2 px-3 py-2 rounded-full inline-block border border-gray-500"> + New Post </a>
      </Link>
      </div>) : null}
  </div>
  )
}

export default List
