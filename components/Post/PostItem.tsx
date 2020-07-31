import * as React from 'react'
import Link from 'next/link'

import { secondToDateString } from 'utils/common';
import { Post } from 'interfaces/Post';

type Props = {
  data: Post,
  isAdmin: Boolean
}

const PostItem: React.FunctionComponent<Props> = ({ data, isAdmin }) => (
  <div className="list-post-item">
    <h2 className="post-title"><Link href="/post/[id]" as={`/post/${data.uid}`}><a> {data.title} </a></Link></h2>
    <div className="post-info-wrapper">
    <div className="post-info">{secondToDateString(data.updatedAt.seconds)}</div>
      <div className="post-info">|</div>
      <a className="post-info when-link" href="/categories/travel"></a>
    </div>
    <div>
      { data.thumbText + '...'}
    </div>
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
    <style jsx>{`
      .post-title a{
        color: #333;
        display: block;
        font-size: 24px;
        text-decoration: none;
        transition: opacity 200ms ease;
      }
      .post-info-wrapper {
        font-size: 10px;
        margin-top: 10px;
        margin-bottom: 10px;
      }
      .post-info {
        color: #969696;
        font-size: 12px;
        margin-right: 8px;
        line-height: 125%;
        letter-spacing: 1px;
        display: inline-block;
        text-transform: uppercase;
      }
      hr {
        border-bottom: none;
      }
    `}</style>
  </div>
)

export default PostItem
