
import React, { useEffect, useCallback, useState } from "react";
import dynamic from 'next/dynamic';



const ReactQuill = dynamic(
  import('react-quill'), { ssr: false, loading: () => <p>Loading ...</p> }
)

export default function (props: any) {
  const [post, setPost] = React.useState<any>({ draffContent: '', published: '', title: '' });

  React.useEffect(() => {
    setPost({...props.post });
  }, [props.post.uid]);

  const setContent = function (content: any) {
    setPost({...post, draffContent: content });
  }

  const onUpdate = function (event: React.FormEvent) {
    const value: string = (event.target as any).value;
    const name: string = (event.target as any).name;
    setPost({ ...post, [name]: value });
  }

  const onSave = function (mode: string) {
    post.published = mode === 'publish';
  }
  console.log('post', post);

  return (
    <>
      <div className="post-edit-page">
        <input value={post.title || ''} name="title" onChange={onUpdate} placeholder="Nhập tiêu đề bài viết" />
        <div className="quill-area">
          <ReactQuill
            value={post.draffContent || ''}
            onChange={setContent}
            theme="bubble"
          />
        </div>
        <button className='submit-save' onClick={() => onSave('draft')}> Save Draft </button>
        <button className='submit-push' onClick={() => onSave('publish')}> Publish </button>
      </div>
    </>
  )
}
