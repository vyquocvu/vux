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
    <div className='post-list'>
    {(items as any[]).map((item: Post) => renderItem(item))}
    {isAdmin ? (
      <div className="mt-6 fixed bottom-6 right-6 md:right-auto md:left-6">
        <Link href="/admin/post/new" legacyBehavior className="inline-flex items-center gap-2 bg-primary-600 text-white text-sm font-semibold px-6 py-3 rounded-full shadow-medium hover:bg-primary-700 hover:shadow-lg transition-all duration-200"> 
          + New Post 
        </Link>
      </div>) : null}
  </div>
  )
}

export default List
