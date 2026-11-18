/**
 * Editor-only stylesheet tweaks for the custom audio/video embeds. Quill's
 * snow theme CSS is bundled in PostEditor, so no CDN links live here anymore.
 */
const QuillStyles = () => (
  <>
    <style>{`
      .ql-snow .ql-toolbar button.ql-audio::before {
        content: "\u266A";
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
