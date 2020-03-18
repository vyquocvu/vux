import * as React from 'react'
import Link from 'next/link'

type Props = {
  data: { name: String, id: String, content: String }
}

const ListItem: React.FunctionComponent<Props> = ({ data }) => (
  <div className="data">
    <h2 className="post-title"><Link href="/post/[id]" as={`/post/${data.id}`}><a> {data.name} </a></Link></h2>
    <div className="post-info-wrapper">
      <div className="post-info">March 2, 2016</div>
      <div className="post-info">|</div>
      <a className="post-info when-link" href="/categories/travel">Travel</a>
    </div>
    <div>
      {
      data.content
      }
    </div>
    <div>
      <Link href="/post/[id]" as={`/post/${data.id}`}><a className="readmore button-round"> Read more → </a></Link>
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
