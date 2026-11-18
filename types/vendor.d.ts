/**
 * Ambient module declarations for the vendored editor dependencies.
 *
 * Quill 1.3.7 and quill-image-resize-module ship no TypeScript types (and we
 * intentionally pin the old majors to keep the editor's Delta format stable),
 * so we treat them as `any` here rather than pull in mismatched @types.
 */
declare module "quill";
declare module "quill-image-resize-module";
