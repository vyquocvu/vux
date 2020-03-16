import * as React from 'react'
import Link from 'next/link'

type Props = {
  data: { name: String, id: String }
}

const ListItem: React.FunctionComponent<Props> = ({ data }) => (
  <div>
    <h2 className="post-title"><Link href="/post/[id]" as={`/post/${data.id}`}><a> {data.name} </a></Link></h2>
    <div className="post-info-wrapper">
      <div className="post-info">March 2, 2016</div>
      <div className="post-info">|</div>
      <a className="post-info when-link" href="/categories/travel">Travel</a>
    </div>
      <Link href="/post/[id]" as={`/post/${data.id}`}><a> {data.id}: {data.name} </a></Link>
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
    `}</style>
  </div>
)

export default ListItem
