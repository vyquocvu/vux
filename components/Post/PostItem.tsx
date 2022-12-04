import type { FunctionComponent } from 'react'
import Link from 'next/link'

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
      <span className="text-gray-900 text-sm my-2 px-3 pt-[5px] pb-[3px] rounded-full inline-block border border-gray-500 cursor-pointer">
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
    <div className="pt-3 px-2 border-b border-b-solid">
      <h2 className="inline-block">
        <Link href={`/post/${slug}`}>
          <span className="text-gray-900 block text-2xl -ml-1 transition-opacity duration-200 ease-in-out hover:underline cursor-pointer">
            {data.title}
          </span>
        </Link>
      </h2>
      {
        isPublished ? '' : <span className="text-red-500"> (Draft) </span>
      }
      <br />
      <div className="text-sm mt-2 mb-2 inline-block">
        <div className="text-xs mr-2 tracking-wider inline-block uppercase text-gray-500">
          {timeFromNow(data.updatedAt.seconds)}
        </div>
      </div>
      <div>
        { data.thumbText + '...' }
        <div>
          {PostLink(isAdmin, slug)}
          {isAdmin && <button className='text-gray-900 text-sm m-2 px-3 pt-[5px] pb-[3px] rounded-full inline-block border border-gray-500' onClick={handleDelete}> Delete </button>}
        </div>
      </div>
    </div>
  )
};

export default PostItem
