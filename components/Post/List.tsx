import type { FunctionComponent } from 'react';
import Link from 'next/link';
import PostItem from './PostItem';
import { Post } from 'interfaces/Post';


type Props = {
  items: Post[],
  isAdmin?: boolean,
}

const List: FunctionComponent<Props> = ({ items = [], isAdmin = false }) => {
  const renderItem = (item: Post) => {
    if (!item.uid) return '';
    return <PostItem key={item.uid} data={item} isAdmin={isAdmin} />
  }
  return (
    <div className='post-list space-y-4'>
      {(items as any[]).map((item: Post) => renderItem(item))}
      {isAdmin ? (
        <div className="mt-6 fixed bottom-6 right-6 md:right-auto md:left-6">
          <Link
            href="/admin/post/new"
            legacyBehavior
            className="inline-flex items-center gap-2 bg-primary text-on-primary font-body text-sm font-medium px-5 py-2.5 rounded-md hover:bg-primary-active transition-colors duration-200"
          >
            + New Post
          </Link>
        </div>
      ) : null}
    </div>
  )
}

export default List
