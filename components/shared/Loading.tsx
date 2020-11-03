import React from "react";

const Loading = () => {
  return (
    <div className="items-center h-full w-full flex justify-center">
      <div className="lds-dual-ring inline-block h-20 w-20 after:block"></div>
    </div>
  );
};

export default Loading;
