/**
 * Shared Quill editor stylesheet links
 * Used in post editor pages to load required Quill CSS
 */
const QuillStyles = () => (
  <>
    <link 
      rel="stylesheet" 
      href="https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.snow.min.css" 
      integrity="sha512-/FHUK/LsH78K9XTqsR9hbzr21J8B8RwHR/r8Jv9fzry6NVAOVIGFKQCNINsbhK7a1xubVu2r5QZcz2T9cKpubw==" 
      crossOrigin="anonymous" 
      referrerPolicy="no-referrer" 
    />
    <link 
      rel="stylesheet" 
      href="https://cdn.jsdelivr.net/npm/quill-image-resize-module@3.0.0/image-resize.min.css" 
    />
    <style>{`
      .ql-snow .ql-toolbar button.ql-audio::before {
        content: "♪";
        font-size: 18px;
        font-weight: bold;
      }
      .ql-snow .ql-toolbar button.ql-audio {
        width: 28px;
      }
      .ql-editor audio,
      .custom-audio-player {
        display: block;
        margin: 10px 0;
        width: 100%;
        max-width: 500px;
      }
      .ql-editor video {
        display: block;
        margin: 10px 0;
        max-width: 100%;
      }
    `}</style>
  </>
);

export default QuillStyles;
