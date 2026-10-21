import React from "react";
import Post from "./Post";
import { useSelector } from "react-redux";

const Posts = () => {
  const { posts } = useSelector((store) => store.post);

  return (
    <div>
      {posts && posts.length > 0 ? (
        posts.map((post) => <Post key={post?._id} post={post} />)
      ) : (
        <div className="flex flex-col items-center justify-center my-16 text-gray-500">
          <p className="font-medium text-base">No posts yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Start following people or share your first post!
          </p>
        </div>
      )}
    </div>
  );
};

export default Posts;

