'use client';

import { useEffect, useState, FormEvent, useRef } from "react";
import upload from 'utils/upload';
import dynamic from 'next/dynamic';
import ReactQuill from "react-quill";

import Script from "next/script";
import { highlight } from "utils/common";

const WrapQuill = dynamic(() => import('./WrapQuill'), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

const postMetaData = {
  url: '',
  uid: '',
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

const imageHandler = function (this: any) {
  const input = document.createElement('input');
  const quill = this.quill;
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();
  input.onchange = async function (e) {
    if (!input.files) return;
    const file = input.files[0];
    const range = quill.getSelection(true);
    quill.insertEmbed(range.index, 'image', `${ window.location.origin }/images/placeholder.webp`);
    quill.setSelection(range.index + 1);
    const url = await upload(file, 'images');
    if (!url) return false;
    quill.deleteText(range.index, 1);
    quill.insertEmbed(range.index, 'image', url);
  }
}

const PostEditor = (props: any) => {
  const [post, setPost] = useState({
    ...postMetaData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    setPost({ ...post,...props.post });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props?.post?.uid]);


  const onUpdate = function (event: FormEvent) {
    const value: string = (event.target as any).value;
    const name: string = (event.target as any).name;
    setPost({ ...post, [name]: value });
  }

  const onSave = function (mode: string) {
    if (quillRef.current) {
      const updatePost  = {
        ...post,
        draffContent: quillRef.current.getEditorContents(),
        thumbText: quillRef.current.getEditor().getText().slice(0, 100),
      }
      updatePost.isPublished = mode === 'publish' || post.isPublished;
      props.onSubmit(updatePost);
    }
  }

  const modules = {
    toolbar: {
      container: [
        [{'header': [1, 2, 3, 4, 5, false]}],
        ['bold', 'italic', 'underline','strike'],
        ['blockquote', 'code-block'],
        [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler
      },
    },
    syntax: true,
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', "code-block",
  ];


  if (!post.uid || typeof window === 'undefined') return null;

  return (
    <div className="flex w-9/12 my-10 mx-auto flex-col">
      <Script
        src='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js'
        onLoad={highlight}
      />
      <input
        value={post.title || ''}
        name="title" onChange={onUpdate}
        placeholder="Title"
        className="w-full text-xl px-3 py-2 rounded-sm mb-3 border border-gray-400 font-medium"
      />
      <div className="mb-3">
        <WrapQuill
          theme="snow"
          formats={formats}
          modules={modules}
          value={post.draffContent || ''}
          quillRef={quillRef}
          placeholder={'Tell your story…'}
        />
      </div>
      <div className="actions">
        <button className='bg-green-500 shadow-xs px-2 py-1 mr-3 text-white' onClick={() => onSave('draft')}> Save Draft </button>
        <button className='bg-blue-500 shadow-xs px-2 py-1 mr-3 text-white' onClick={() => onSave('publish')}> Publish </button>
      </div>
    </div>
  );
}

export default PostEditor;
