
import * as React from 'react'
import dynamic from 'next/dynamic';



const ReactQuill = dynamic(
  import('react-quill'), { ssr: false, loading: () => <p>Loading ...</p> }
)

export default function () {
  const [post, setPost] = React.useState({ title: '', content: '' });
  const setContent = function (content) {
    console.log('content', content);
    setPost({...setPost, content });
  }


  return (
    <div>
      <input />
      <ReactQuill
        value={post.content}
        onChange={setContent}
        theme="bubble"
      />
    </div>
  )
}
