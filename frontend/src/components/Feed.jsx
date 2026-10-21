import React from "react";
import Posts from "./Posts";
import Stories from "./Stories";

const Feed = () => {
  return (
    <div className="flex-1 mt-4 mb-8 flex flex-col items-center max-w-[620px] w-full mx-auto px-2">
      <Stories />
      <Posts />
    </div>
  );
};

export default Feed;
