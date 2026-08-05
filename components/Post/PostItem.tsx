import type { FunctionComponent } from 'react'
import Link from 'next/link';

import { timeFromNow, friendlyStr } from 'utils/common';
import { Post } from 'interfaces/Post';

type Props = {
  data: Post,
  isAdmin: boolean
}

const PostLink = (isAdmin: boolean, id: string) => (
  <Link href={`${isAdmin ? '/admin' : ''}/post/${id}`}>
    <span className="font-body text-sm font-medium text-primary hover:text-primary-active transition-colors duration-200 cursor-pointer inline-flex items-center gap-1">
      {isAdmin ? 'Edit' : 'Read more'} →
    </span>
  </Link>
);

const PostItem: FunctionComponent<Props> = ({ data, isAdmin }) => {
  const { isPublished } = data;
  const slug = `${friendlyStr(data.title)}.${data.uid}`;
  const handleDelete = async () => {
    let text = "Press OK to make sure you want to delete this post";
    if (confirm(text) == true) {
      try {
        const res = await fetch(`/api/admin/posts/${data.uid}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error("Delete failed");
        location.reload();
      } catch (error) {
        console.log(error);
      }
    }
  };
  return (
    <div className='flex pb-0 xs:flex-wrap lg:flex-nowrap mb-4 last:mb-0 bg-surface-card dark:bg-surface-dark-elevated rounded-lg p-6 md:p-8'>
      <div className="flex-1">
        <h2 className="inline-block">
          <Link href={`/post/${slug}`}>
            <span className="font-display text-2xl font-normal text-ink dark:text-on-dark block transition-colors duration-200 hover:text-primary cursor-pointer leading-tight tracking-tight">
              {data.title}
            </span>
          </Link>
        </h2>
        {
          isPublished ? '' : (
            <span className="font-body text-xs uppercase tracking-widest font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-pill ml-2">Draft</span>
          )
        }
        <div className="mt-2 mb-3">
          <span className="font-body text-xs uppercase tracking-widest text-muted dark:text-muted-soft font-medium">
            {timeFromNow(data.updatedAt)}
          </span>
        </div>
        <p className="font-body text-sm text-body dark:text-on-dark-soft leading-relaxed mb-4">
          {data.thumbText + '...'}
        </p>
        <div className="flex gap-4 flex-wrap items-center">
          {PostLink(isAdmin, slug)}
          {isAdmin && (
            <button
              className="font-body text-sm font-medium text-error hover:text-error/80 transition-colors duration-200"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
};

export default PostItem
