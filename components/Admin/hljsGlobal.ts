import hljs from "highlight.js";

/**
 * Imported before `quill` so that `window.hljs` exists the moment quill.js is
 * evaluated. Quill 1.3.7 computes its Syntax module default `highlight` option
 * via an IIFE at load time (`if (window.hljs == null) return null`); if the
 * global isn't set first, that option stays null and `new Quill(...)` throws
 * "Syntax module requires highlight.js" — the editor never builds.
 *
 * Quill's default highlighter calls `window.hljs.highlightAuto`, which the v11
 * build still exposes, so no element-API shim is needed here.
 */
if (typeof window !== "undefined") {
  (window as any).hljs = hljs;
}

export default hljs;
