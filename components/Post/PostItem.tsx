import * as React from 'react'
import Link from 'next/link'

import { timeFromNow } from 'utils/common';
import { Post } from 'interfaces/Post';

type Props = {
  data: Post,
  isAdmin: Boolean
}

const PostItem: React.FunctionComponent<Props> = ({ data, isAdmin }) => (
  <div className="list-post-item">
    <h2 className="post-item-title"><Link href="/post/[id]" as={`/post/${data.uid}`}><a> {data.title} </a></Link></h2>
    <div className="post-info-wrapper">
      <div className="post-info__from-now">{timeFromNow(data.updatedAt.seconds)}</div>
        {/* <div className="post-info">|</div> */}
      </div>
    <div>
      { data.thumbText + '...' }
      <div>
      {
        isAdmin ? (
          <Link href="/admin/post/[id]" as={`/admin/post/${data.uid}`}>
            <a className="readmore button-round">
            Edit → </a>
          </Link>
        ) : (
          <Link href="/post/[id]" as={`/post/${data.uid}`}>
            <a className="readmore button-round">
            Read more → </a>
          </Link>
        )
      }
    </div>
    </div>
  </div>
)

export default PostItem
