import * as React from 'react'
import Link from 'next/link'

import { timeFromNow } from 'utils/common';
import { Post } from 'interfaces/Post';

type Props = {
  data: Post,
  id?: string;
  isAdmin: boolean
}

const PostLink = (isAdmin: boolean, id: string) => (
    <Link href={`${isAdmin ? '/admin' : ''}/post/[id]`} as={`${isAdmin ? '/admin' : ''}/post/${id}`}>
      <a className="text-gray-900 text-sm text-sm my-2 px-3 py-2 rounded-full inline-block border border-gray-500">
        {isAdmin ? 'Edit' : 'Read more'} →
      </a>
    </Link>
);

const PostItem: React.FunctionComponent<Props> = ({ data, isAdmin }) => (
  <div className="pt-3 px-2 border-b border-b-solid">
    <h2 className="inline-block">
      <Link href="/post/[id]" as={`/post/${data.title.replace(/ /g, '-')}.${data.uid}`}>
        <a className="text-gray-900 block text-2xl -ml-1 transition-opacity duration-200 ease-in-out"> {data.title} </a>
      </Link>
    </h2>
    <div className="text-sm pl-2 mt-2 mb-2 inline-block">
      <div className="text-xs mr-2 tracking-wider inline-block uppercase">
        {timeFromNow(data.updatedAt.seconds)}
      </div>
    </div>
    <div>
      { data.thumbText + '...' }
      <div>
        {PostLink(isAdmin, data.uid)}
      </div>
    </div>
  </div>
)

export default PostItem
