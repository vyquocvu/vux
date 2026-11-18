import "./hljsGlobal"; // side effect: window.hljs must exist before quill evaluates
import Quill from "quill";
import hljs from "highlight.js";

/**
 * Editor vendor bootstrap, imported *before* `quill-image-resize-module`.
 *
 * Two load-order traps force this split:
 *   1. Quill 1.3.7's Syntax module needs `window.hljs` present at its own
 *      evaluation — handled by importing ./hljsGlobal first.
 *   2. quill-image-resize-module dereferences `window.Quill` at import-eval
 *      time, so we publish the global here, before PostEditor imports that
 *      package on the next import statement.
 *
 * ES imports evaluate in source order, so this module fully runs (globals set)
 * before the ImageResize import that follows it in PostEditor.
 */
if (typeof window !== "undefined") {
  (window as any).Quill = Quill;
}

export { Quill, hljs };
