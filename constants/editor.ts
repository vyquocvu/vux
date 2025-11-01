/**
 * Constants for the post editor
 */

// Keyboard key codes
export const KEY_CODES = {
  COMMA: 188,
  ENTER: 13,
} as const;

// Quill editor configuration
export const QUILL_MODULES = {
  toolbar: {
    container: [
      [{ 'header': [1, 2, 3, 4, 5, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean'],
    ],
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
} as const;

export const QUILL_FORMATS = [
  'header',
  'bold',
  'italic', 
  'underline',
  'strike',
  'blockquote',
  'align',
  'list',
  'bullet',
  'indent',
  'link',
  'image',
  'code-block',
] as const;

// Default post metadata template
export const DEFAULT_POST_METADATA = {
  url: '',
  uid: '',
  tags: [] as any,
  title: '',
  createdAt: '',
  updatedAt: '',
  thumbText: '',
  thumbImage: '',
  draftContent: '',
  publishContent: '',
  isPublished: false,
} as const;

// Editor mode
export const EDITOR_MODE = {
  DRAFT: 'draft',
  PUBLISH: 'publish',
} as const;

// Message templates
export const EDITOR_MESSAGES = {
  SAVING_DRAFT: 'Saving draft...',
  PUBLISHING: 'Publishing...',
} as const;

// Placeholder images
export const PLACEHOLDER_IMAGE = '/images/placeholder.webp';

// Highlight.js supported languages
export const SUPPORTED_LANGUAGES = ['javascript', 'css', 'html', 'typescript'] as const;
