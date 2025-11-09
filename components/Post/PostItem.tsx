import type { FunctionComponent } from 'react'
import Link from 'next/link';
import Image from 'next/image';

import { timeFromNow, friendlyStr } from 'utils/common';
import { Post } from 'interfaces/Post';
import { deletePost } from 'fetcher/post';

type Props = {
  data: Post,
  id?: string;
  isAdmin: boolean
}

const PostLink = (isAdmin: boolean, id: string) => (
    <Link href={`${isAdmin ? '/admin' : ''}/post/${id}`}>
      <span className="text-primary-600 text-sm font-medium my-2 px-4 py-2 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-all duration-200 hover:bg-primary-50 hover:shadow-soft border border-primary-200 hover:border-primary-300">
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
        await deletePost(data.uid);
        location.reload();
      } catch (error) {
        console.log(error);
      }
    }
  };
  return (
    <div className='flex pt-6 pb-8 px-2 sm:px-4 xs:flex-wrap lg:flex-nowrap border-b border-neutral-200 last:border-b-0 hover:bg-neutral-50 transition-colors duration-200 rounded-lg -mx-2'>
      {/* <div className='pl-1 py-2 pr-3 min-w-[320px] xs:w-full sm:w-auto'>
        <Image priority src={data.thumbImage || "/noimage.avif"} alt={data.title} width={300} height={150} style={{ maxHeight: 150 }} />
      </div> */}
      <div className="px-2 flex-1">
        <h2 className="inline-block">
          <Link href={`/post/${slug}`}>
            <span className="text-neutral-900 block text-2xl font-bold -ml-1 transition-all duration-200 ease-in-out hover:text-primary-600 cursor-pointer leading-tight">
              {data.title}
            </span>
          </Link>
        </h2>
        {
          isPublished ? '' : <span className="text-red-500 text-sm font-medium bg-red-50 px-2 py-1 rounded-md ml-1"> Draft </span>
        }
        <br />
        <div className="text-sm mt-3 mb-3 inline-block">
          <div className="text-xs mr-2 tracking-wider inline-block uppercase text-neutral-500 font-semibold">
            {timeFromNow(data.updatedAt.seconds)}
          </div>
        </div>
        <div className="text-neutral-600 leading-relaxed">
          { data.thumbText + '...' }
          <div className="mt-4 flex gap-2 flex-wrap items-center">
            {PostLink(isAdmin, slug)}
            {isAdmin && <button className='text-red-600 text-sm px-4 py-2 h-9 rounded-lg inline-flex items-center border border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200' onClick={handleDelete}> Delete </button>}
          </div>
        </div>
      </div>
    </div>
  )
};

export default PostItem
