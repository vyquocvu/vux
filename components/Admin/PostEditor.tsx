import React, { useEffect, useState, useCallback } from "react";
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(
  import('react-quill'), { ssr: false, loading: () => <p>Loading ...</p> }
)

const postMetaData = {
  url: '',
  tags: [],
  title: '',
  createdAt: '',
  updatedAt: '',
  thumbText: '',
  thumbImage: '',
  draffContent: '',
  publishContent: '',
  isPublished: false,
};

export default function (props: any) {
  const [post, setPost] = useState<any>({
    ...postMetaData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  useEffect(() => {
    setPost({ ...props.post });
  }, [props.post.uid]);

  const setContent = useCallback((newData: any, prePost) => {
    setPost({ ...prePost, draffContent: newData });
  }, []);

  const onUpdate = function (event: React.FormEvent) {
    const value: string = (event.target as any).value;
    const name: string = (event.target as any).name;
    setPost({ ...post, [name]: value });
  }

  const onSave = function (mode: string) {
    const isPublished = mode === 'publish';
    post.isPublished = isPublished;
    if (isPublished) post.publishContent = post.draffContent;
    props.onSubmit(post);
  }

  const modules = {
    toolbar: [
      [{'header': [1, 2, false]}],
      ['bold', 'italic', 'underline','strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

  if (!post.uid) return <p>Loading ...</p>;

  return (
    <div className="post-edit-page">
      <input value={post.title || ''} name="title" onChange={onUpdate} placeholder="Title" />
      <div className="quill-area">
        <ReactQuill
          value={post.draffContent || ''}
          placeholder={'Tell your story…'}
          formats={formats}
          modules={modules}
          onChange={(dataContent) => setContent(dataContent, post)}
          theme="snow"
        />
      </div>
      <div className="actions">
        <button className='submit-save' onClick={() => onSave('draft')}> Save Draft </button>
        <button className='submit-push' onClick={() => onSave('publish')}> Publish </button>
      </div>
    </div>
    )
}
