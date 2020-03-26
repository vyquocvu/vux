
import * as React from 'react'
import dynamic from 'next/dynamic';



const ReactQuill = dynamic(
  import('react-quill'), { ssr: false, loading: () => <p>Loading ...</p> }
)

export default function () {
  const [post, setPost] = React.useState({ title: '', draffContent: '', publishContent: '', published: false });
  const setContent = function (content: any) {
    setPost({...post, draffContent: content });
  }

  const onUpdate = function (event: React.FormEvent) {
    const value: string = (event.target as any).value;
    const name: string = (event.target as any).name;
    setPost({...post, [name]: value});
  }

  const onSave = function (mode: string) {
    post.published = mode === 'publish';
  }

  return (
    <div>
      <input value={post.title} name="title" onChange={onUpdate} placeholder="Nhập tiêu đề bài viết" />
      <ReactQuill
        value={post.draffContent}
        onChange={setContent}
        theme="bubble"
      />
      <button onClick={() => onSave('draft')}> Save Draft </button>
      <button onClick={() => onSave('publish')}> Publish </button>
    </div>
  )
}
