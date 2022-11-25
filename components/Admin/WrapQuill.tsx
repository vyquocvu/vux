import ReactQuill from "react-quill";

const WrapQuill = (props: any) => {
  const { quillRef } = props;
  return (
    <div>
      <ReactQuill {...props} ref={quillRef} />
    </div>
  );
};

export default WrapQuill;