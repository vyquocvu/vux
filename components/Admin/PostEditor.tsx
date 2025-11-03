'use client';

declare global {
  interface Window {
    ImageResize: any;
    Quill: any;
  }
}

import Script from "next/script";
import dynamic from "next/dynamic";
import { ReactTagsProps, Tag } from 'react-tag-input';
import { useEffect, useState, FormEvent, useRef } from "react";

import upload from 'utils/upload';
import Loading from "components/shared/Loading";
import LoadingOverlay from "components/shared/LoadingOverlay";
import { TAGS } from "~utils/tags";
import { Post } from "interfaces/Post";
import { 
  KEY_CODES, 
  QUILL_FORMATS, 
  DEFAULT_POST_METADATA,
  EDITOR_MODE,
  EDITOR_MESSAGES,
  PLACEHOLDER_IMAGE,
  SUPPORTED_LANGUAGES
} from "constants/editor";

const ReactTags = dynamic(
  () => import('react-tag-input').then(lib => lib.WithContext) as any,
  { ssr: false }
) as React.ComponentType<ReactTagsProps>;

interface PostEditorProps {
  post: Partial<Post>;
  onSubmit: (post: Post) => void;
}

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
    quill.insertEmbed(range.index, 'image', `${ window.location.origin }${PLACEHOLDER_IMAGE}`);
    quill.setSelection(range.index + 1);
    const url = await upload(file, 'images');
    if (!url) return false;
    quill.deleteText(range.index, 1);
    quill.insertEmbed(range.index, 'image', url);
  }
}

const videoHandler = function (this: any) {
  const quill = this.quill;
  const url = prompt('Enter video URL (YouTube, Vimeo, etc.):');
  if (url) {
    const range = quill.getSelection(true);
    quill.insertEmbed(range.index, 'video', url);
    quill.setSelection(range.index + 1);
  }
}

const audioHandler = function (this: any) {
  const quill = this.quill;
  const choice = confirm('Click OK to upload an audio file, or Cancel to enter a URL');
  
  if (choice) {
    // Upload audio file
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'audio/*');
    input.click();
    input.onchange = async function (e) {
      if (!input.files) return;
      const file = input.files[0];
      const range = quill.getSelection(true);
      const url = await upload(file, 'audios');
      if (!url) return false;
      // Insert audio HTML
      quill.insertEmbed(range.index, 'audio', url);
      quill.setSelection(range.index + 1);
    }
  } else {
    // Enter URL
    const url = prompt('Enter audio URL:');
    if (url) {
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'audio', url);
      quill.setSelection(range.index + 1);
    }
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
      ['link', 'image', 'video', 'audio'],
      ['clean'],
    ],
    handlers: {
      image: imageHandler,
      video: videoHandler,
      audio: audioHandler
    },
  },
  imageResize: {
    displayStyles: {
      backgroundColor: 'black',
      border: 'none',
      color: 'white'
    },
    modules: ['Resize', 'DisplaySize', 'Toolbar']
  },
  syntax: true,
};

const formats = QUILL_FORMATS;

const delimiters = [KEY_CODES.COMMA, KEY_CODES.ENTER];

const PostEditor = (props: PostEditorProps) => {
  const [post, setPost] = useState<Partial<Post>>({
    ...DEFAULT_POST_METADATA,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [isLoadQuill, setIsLoadQuill] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadHighlight, setIsLoadHighlight] = useState(false);
  const [isLoadImageResize, setIsLoadImageResize] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingMessage, setSavingMessage] = useState('');
  const quillRef = useRef<any>(null);

  useEffect(() => {
    setPost({ ...post,...props.post });
    // Hide loading overlay when post changes (submission complete)
    setIsSaving(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props?.post?.uid]);

  useEffect(() => {
    if (post.tags && Array.isArray(post.tags)) {
      setTags(post.tags.map((tag: string) => {
        return {
          id: tag,
          text: tag
        };
      }));
    }
  }, [post.tags]);

  const onUpdate = function (event: FormEvent) {
    const value: string = (event.target as any).value;
    const name: string = (event.target as any).name;
    setPost({ ...post, [name]: value });
  }

  const onSave = function (mode: 'draft' | 'publish') {
    const quill = quillRef.current;
    const { ops = [] } = quill.getContents();
    const firstImage = ops.find((op: any) => op.insert?.image);
    if (quill) {
      // Show overlay with appropriate message
      setSavingMessage(mode === EDITOR_MODE.PUBLISH ? EDITOR_MESSAGES.PUBLISHING : EDITOR_MESSAGES.SAVING_DRAFT);
      setIsSaving(true);
      
      const updatePost = {
        ...post,
        uid: post.uid || '',
        draftContent: quill.root.innerHTML,
        thumbText: quill.getText().slice(0, 100),
        thumbImage: firstImage?.insert?.image || '',
        tags: tags.map(tag => tag.text),
        isPublished: mode === EDITOR_MODE.PUBLISH || post.isPublished || false,
      };
      props.onSubmit(updatePost as Post);
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
    if (isLoadQuill && isLoadHighlight && isLoadImageResize && post.uid) {
      setTimeout(() => {
        // Register ImageResize module before creating Quill instance
        window.Quill.register('modules/imageResize', window.ImageResize.default);
  
        // Register custom audio Blot
        const BlockEmbed = window.Quill.import('blots/block/embed');
        class AudioBlot extends BlockEmbed {
          static create(value: string) {
            const node = super.create();
            node.setAttribute('src', value);
            node.setAttribute('controls', 'controls');
            node.setAttribute('controlsList', 'nodownload');
            node.setAttribute('style', 'width: 100%; max-width: 500px;');
            return node;
          }

          static value(node: HTMLElement) {
            return node.getAttribute('src');
          }
        }
        AudioBlot.blotName = 'audio';
        AudioBlot.tagName = 'audio';
        window.Quill.register(AudioBlot);

        quillRef.current =  new window.Quill('#editor', {
          theme: 'snow',
          modules,
          formats
        });

        // Preserve scroll position on paste to prevent auto-scroll to top
        const quill = quillRef.current;
        const editorContainer = quill.container;
        let scrollTop = 0;
        let scrollLeft = 0;
        
        // Listen for the clipboard paste event
        editorContainer.addEventListener('paste', () => {
          // Store current scroll position before paste
          scrollTop = window.scrollY || document.documentElement.scrollTop;
          scrollLeft = window.scrollX || document.documentElement.scrollLeft;
          
          // Restore scroll position after Quill processes the paste
          setTimeout(() => {
            window.scrollTo(scrollLeft, scrollTop);
          }, 0);
        });
      }, 100);
    }
  }, [isLoadHighlight, isLoadQuill, isLoadImageResize, post.uid])


  if (!post.uid || typeof window === 'undefined') return null;

  return (
    <div className="flex xl:w-9/12 my-10 mx-auto flex-col">
      {isSaving && <LoadingOverlay message={savingMessage} />}
      <Script
        src='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js'
        onReady={() => {
          (window as any).hljs.configure({ languages: SUPPORTED_LANGUAGES });
          setIsLoadHighlight(true);
        }}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.min.js"
        onReady={() => setIsLoadQuill(true)}
      />
      {isLoadQuill ? <Script
        src="https://cdn.jsdelivr.net/npm/quill-image-resize-module@3.0.0/image-resize.min.js"
        onReady={() => setIsLoadImageResize(true)}
      /> : ""}
      <input
        value={post.title || ''}
        name="title" onChange={onUpdate}
        placeholder="Title"
        className="w-full text-xl px-3 py-2 rounded-sm mb-3 border border-gray-400 font-medium"
      />
      <div className="mb-3">
        {isLoadQuill && isLoadImageResize ? "" : <Loading />}
        <div className={isLoadQuill && isLoadImageResize ? "" : "hidden"} placeholder={'Tell your story…'} id="editor" dangerouslySetInnerHTML={{ __html: post.draftContent || '' }}>
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
        <button className='bg-green-500 shadow-xs px-2 py-1 mr-3 text-white' onClick={() => onSave(EDITOR_MODE.DRAFT)}> Save Draft </button>
        <button className='bg-blue-500 shadow-xs px-2 py-1 mr-3 text-white' onClick={() => onSave(EDITOR_MODE.PUBLISH)}> Publish </button>
      </div>
    </div>
  );
}

export default PostEditor;
