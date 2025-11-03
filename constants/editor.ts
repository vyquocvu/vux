/**
 * Constants for the post editor
 */

// Keyboard key codes
export const KEY_CODES = {
  COMMA: 188,
  ENTER: 13,
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
  'video',
  'audio',
  'code-block',
] as const;

// Default post metadata template
export const DEFAULT_POST_METADATA = {
  url: '',
  uid: '',
  tags: [] as string[],
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
