import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Link } from "react-router-dom";
import SuggestedUsers from "./SuggestedUsers";
import { useSelector } from "react-redux";
import useGetSuggestedUsers from "@/hooks/useGetSuggestedUsers";

const RightSidebar = () => {
  useGetSuggestedUsers();
  const { user } = useSelector((store) => store.auth);

  return (
    <div className="w-[320px] my-6 pl-4 select-none">
      {/* Current logged-in user summary */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link to={`/profile/${user?._id || ""}`} className="shrink-0">
            <Avatar className="w-11 h-11 border border-neutral-200">
              <AvatarImage src={user?.profilePicture} alt="user_avatar" className="object-cover" />
              <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase() || "CN"}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1 pr-2">
            <h1 className="font-semibold text-sm truncate">
              <Link
                to={`/profile/${user?._id || ""}`}
                className="hover:underline text-gray-900 block truncate max-w-[145px]"
                title={user?.username}
              >
                {user?.username || "Guest User"}
              </Link>
            </h1>
            <span className="text-gray-500 text-xs block truncate max-w-[145px]">
              {user?.bio || "Bio here..."}
            </span>
          </div>
        </div>
        <Link
          to={`/profile/${user?._id || ""}`}
          className="shrink-0 text-xs font-semibold text-[#0095F6] hover:text-[#1877F2]"
        >
          Switch
        </Link>
      </div>

      {/* Suggested users list container */}
      <SuggestedUsers />
    </div>
  );
};

export default RightSidebar;
