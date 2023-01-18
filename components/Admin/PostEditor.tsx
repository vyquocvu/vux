'use client';


declare global {
  interface Window {
    ImageResize: any;
    Quill: any;
  }
}

import Script from "next/script";
import dynamic from "next/dynamic";
import { Tag } from 'react-tag-input';
import { useEffect, useState, FormEvent, useRef } from "react";

import upload from 'utils/upload';
import Loading from "components/shared/Loading";
import { TAGS } from "~utils/tags";

const ReactTags = dynamic(
  () => import('react-tag-input').then(lib => lib.WithContext) as any,
  { ssr: false }
);


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

const suggestions = TAGS.map(tag => {
  return {
    id: tag,
    text: tag
  };
});
const modules = {
  toolbar: {
    container: [
      [{'header': [1, 2, 3, 4, 5, false]}],
      ['bold', 'italic', 'underline','strike'],
      ['blockquote', 'code-block'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      [{'align': [] }],
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
  'align',
  'list', 'bullet', 'indent',
  'link', 'image', "code-block",
];

const KeyCodes = {
  comma: 188,
  enter: 13
};

const delimiters = [KeyCodes.comma, KeyCodes.enter];

const PostEditor = (props: any) => {
  const [post, setPost] = useState({
    ...postMetaData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [isLoadQuill, setIsLoadQuill] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadHighlight, setIsLoadHighlight] = useState(false);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    setPost({ ...post,...props.post });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props?.post?.uid]);

  useEffect(() => {
    setTags(post.tags.map((tag: string) => {
      return {
        id: tag,
        text: tag
      };
    }));
  }, [post.tags]);
  console.log(post)
  console.log(tags)

  const onUpdate = function (event: FormEvent) {
    const value: string = (event.target as any).value;
    const name: string = (event.target as any).name;
    setPost({ ...post, [name]: value });
  }

  const onSave = function (mode: string) {
    const quill = quillRef.current;
    const { ops = [] } = quill.getContents();
    const firstImage = ops.find((op: any) => op.insert?.image);
    if (quill) {
      const updatePost  = {
        ...post,
        draffContent: quill.root.innerHTML,
        thumbText: quill.getText().slice(0, 100),
        thumbImage: firstImage?.insert?.image || '',
        tags: tags.map(tag => tag.text),
      }
      updatePost.isPublished = mode === 'publish' || post.isPublished;
      props.onSubmit(updatePost);
    }
  }
  const handleDelete = (i: number) => {
    setTags(tags.filter((tag, index) => index !== i));
  };

  const handleAddition = (tag: Tag) => {
    setTags([...tags, tag]);
  };

  const handleDrag = (tag: Tag, currPos: number, newPos: number) => {
    const newTags = tags.slice();

    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);

    // re-render
    setTags(newTags);
  };

  const handleTagClick = (index: number) => {
    console.log('The tag at index ' + index + ' was clicked');
  };

  useEffect(() => {
    if (isLoadQuill && isLoadHighlight && post.uid) {
      setTimeout(() => {
        quillRef.current =  new window.Quill('#editor', {
          theme: 'snow',
          modules,
          formats
        });
      }, 100);
    }
  }, [isLoadHighlight, isLoadQuill, post.uid])


  if (!post.uid || typeof window === 'undefined') return null;

  return (
    <div className="flex xl:w-9/12 my-10 mx-auto flex-col">
      <Script
        src='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js'
        onReady={() => {
          (window as any).hljs.configure({ languages: ['javascript', 'css', 'html', 'typescript'] });
          console.log(new Date());
          setIsLoadHighlight(true);
        }}
      />
      {isLoadHighlight ? <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.min.js"
        onReady={() => {
          console.log(new Date());
          setIsLoadQuill(true);
        }}
      /> : ""}
      <input
        value={post.title || ''}
        name="title" onChange={onUpdate}
        placeholder="Title"
        className="w-full text-xl px-3 py-2 rounded-sm mb-3 border border-gray-400 font-medium"
      />
      <div className="mb-3">
        {isLoadQuill ? "" : <Loading />}
        <div className={isLoadQuill ? "" : "hidden"} placeholder={'Tell your story…'} id="editor" dangerouslySetInnerHTML={{ __html: post.draffContent || '' }}>
        </div>
      </div>
      Tags
      <ReactTags
        tags={tags}
        suggestions={suggestions}
        delimiters={delimiters}
        handleDrag={handleDrag}
        handleDelete={handleDelete}
        handleAddition={handleAddition}
        handleTagClick={handleTagClick}
      />
      <div className="actions mt-10">
        <button className='bg-green-500 shadow-xs px-2 py-1 mr-3 text-white' onClick={() => onSave('draft')}> Save Draft </button>
        <button className='bg-blue-500 shadow-xs px-2 py-1 mr-3 text-white' onClick={() => onSave('publish')}> Publish </button>
      </div>
    </div>
  );
}

export default PostEditor;
