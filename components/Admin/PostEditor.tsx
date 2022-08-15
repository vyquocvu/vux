import React, { useEffect, useState, useCallback } from "react";
import dynamic from 'next/dynamic';
import upload from 'utils/upload';

const ReactQuill = dynamic(import('react-quill'), { ssr: false });
// const ReactQuill = require('react-quill');

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
    quill.insertEmbed(range.index, 'image', `${ window.location.origin }/images/placeholder.gif`);
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

  useEffect(() => {
    setPost({ ...post,...props.post });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props?.post?.uid]);

  if (typeof window === 'undefined') return null;

  const onChange = (prePost: any) => (newData: string, delta: any, source: any, editor: any) => {
    setPost({
      ...prePost,
      draffContent: newData,
      thumbText: editor.getText().replace(/(\r\n|\n|\r)+/gm, " ").substring(0, 100)
    });
  };

  const onUpdate = function (event: React.FormEvent) {
    const value: string = (event.target as any).value;
    const name: string = (event.target as any).name;
    setPost({ ...post, [name]: value });
  }

  const onSave = function (mode: string) {
    post.isPublished = mode === 'publish' || post.isPublished;
    props.onSubmit(post);
  }

  const modules = {
    toolbar: {
      container: [
        [{'header': [1, 2, false]}],
        ['bold', 'italic', 'underline','strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

  // const handleDelete = function (i: number) {
  //   const tags = [...post.tags];
  //   tags.splice(i, 1);
  //   setPost({ ...post, tags });
  // }

  // const handleAddition = function (tag: string) {
  //   const tags = [...post.tags, tag];
  //   setPost({ ...post, tags });
  // }

  // const handleDrag = function (tag: string, currPos: number, newPos: number) {
  //   const tags = [...post.tags];
  //   const newTags = tags.slice();
  //   newTags.splice(currPos, 1);
  //   newTags.splice(newPos, 0, tag);
  //   setPost({ ...post, tags: newTags });
  // }
  if (!post.uid) return null;
  return (
    <div className="flex w-9/12 my-10 mx-auto flex-col">
      <input
        value={post.title || ''}
        name="title" onChange={onUpdate}
        placeholder="Title"
        className="w-full text-xl px-3 py-2 rounded-sm mb-3 border border-gray-400 font-medium"
      />
      <div className="mb-3">
        <ReactQuill
          theme="snow"
          formats={formats}
          modules={modules}
          value={post.draffContent || ''}
          placeholder={'Tell your story…'}
          onChange={onChange(post)}
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
