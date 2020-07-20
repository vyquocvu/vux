import * as React from 'react'
import Link from 'next/link'

import { secondToDateString } from '../../utils/common';
import { Post } from 'interfaces/Post';

type Props = {
  data: Post,
  isAdmin: Boolean
}

const ListItem: React.FunctionComponent<Props> = ({ data, isAdmin }) => (
  <div className="data">
    <h2 className="post-title"><Link href="/post/[id]" as={`/post/${data.uid}`}><a> {data.title} </a></Link></h2>
    <div className="post-info-wrapper">
    <div className="post-info">{secondToDateString(data.updatedAt.seconds)}</div>
      <div className="post-info">|</div>
      <a className="post-info when-link" href="/categories/travel"></a>
    </div>
    <div>
      { data.publishContent }
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
    <hr className="divider"/>
    <style jsx>{`
      .post-title a{
        display: block;
        transition: opacity 200ms ease;
        color: #333;
        text-decoration: none;
      }
      .post-info-wrapper {
        margin-top: 10px;
        margin-bottom: 10px;
        font-size: 10px;
      }
      .post-info {
        display: inline-block;
        margin-right: 8px;
        color: #969696;
        font-size: 12px;
        line-height: 125%;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      .button-round {
        color: #333;
        margin: 10px 0;
        font-size: 14px;
        font-weight: 300;
        padding: 5px 12px;
        border-radius: 20px;
        text-decoration: none;
        display: inline-block;
        background-color: #fff;
        border: 1px solid #d3d3d3;
        transition: border 200ms ease, color 200ms ease;
      }
      hr {
        border-bottom: none;
      }
    `}</style>
  </div>
)

export default ListItem
