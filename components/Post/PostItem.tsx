import * as React from 'react'
import Link from 'next/link'

import { timeFromNow, friendlyStr } from 'utils/common';
import { Post } from 'interfaces/Post';

type Props = {
  data: Post,
  id?: string;
  isAdmin: boolean
}

const PostLink = (isAdmin: boolean, id: string) => (
    <Link href={`${isAdmin ? '/admin' : ''}/post/[id]`} as={`${isAdmin ? '/admin' : ''}/post/${id}`}>
      <a className="text-gray-900 text-sm my-2 px-3 pt-[5px] pb-[3px] rounded-full inline-block border border-gray-500">
        {isAdmin ? 'Edit' : 'Read more'} →
      </a>
    </Link>
);

const PostItem: React.FunctionComponent<Props> = ({ data, isAdmin }) => {
  const { isPublished } = data;
  const slug = `${friendlyStr(data.title)}.${data.uid}`;
  return (
    <div className="pt-3 px-2 border-b border-b-solid">
      <h2 className="inline-block">
        <Link href="/post/[id]" as={`/post/${slug}`}>
          <a className="text-gray-900 block text-2xl -ml-1 transition-opacity duration-200 ease-in-out hover:underline"> {data.title} </a>
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
        </div>
      </div>
    </div>
  )
};

export default PostItem
