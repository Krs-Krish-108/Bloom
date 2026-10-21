import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const Comment = ({ comment }) => {
  return (
    <div className="my-3 flex items-start gap-3">
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage
          src={comment?.author?.profilePicture}
          alt={comment?.author?.username}
        />
        <AvatarFallback>
          {comment?.author?.username?.slice(0, 2).toUpperCase() || "CN"}
        </AvatarFallback>
      </Avatar>
      <div className="text-sm">
        <span className="font-semibold mr-2">
          {comment?.author?.username}
        </span>
        <span className="text-gray-800">{comment?.text}</span>
      </div>
    </div>
  );
};

export default Comment;
