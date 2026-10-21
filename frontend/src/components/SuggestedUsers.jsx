import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constants";
import { setAuthUser } from "@/redux/authSlice";
import { toast } from "sonner";

const SuggestedUsers = () => {
  const dispatch = useDispatch();
  const { suggestedUsers, user } = useSelector((store) => store.auth);

  const followOrUnfollowHandler = async (targetUserId) => {
    try {
      const res = await axios.post(
        `${USER_API_END_POINT}/followorunfollow/${targetUserId}`,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        const isFollowing = user?.following?.some(
          (id) => (typeof id === "object" ? id?._id : id) === targetUserId
        );

        let updatedFollowing;
        if (isFollowing) {
          updatedFollowing = (user?.following || []).filter(
            (id) => (typeof id === "object" ? id?._id : id) !== targetUserId
          );
        } else {
          updatedFollowing = [...(user?.following || []), targetUserId];
        }

        dispatch(setAuthUser({ ...user, following: updatedFollowing }));
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update follow status");
    }
  };

  return (
    <div className="my-5">
      <div className="flex items-center justify-between text-sm mb-4">
        <h1 className="font-semibold text-gray-500 text-sm">Suggested for you</h1>
        <span className="font-medium text-xs cursor-pointer text-gray-900 hover:text-gray-600">
          See All
        </span>
      </div>

      {suggestedUsers && suggestedUsers.length > 0 ? (
        suggestedUsers.map((u) => {
          const isFollowing = user?.following?.some(
            (id) => (typeof id === "object" ? id?._id : id) === u?._id
          );

          return (
            <div
              key={u._id}
              className="flex items-center justify-between my-3 gap-2"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Link to={`/profile/${u._id}`} className="shrink-0">
                  <Avatar className="w-10 h-10 border border-neutral-100">
                    <AvatarImage src={u?.profilePicture} alt="user_avatar" className="object-cover" />
                    <AvatarFallback>
                      {u?.username?.slice(0, 2).toUpperCase() || "CN"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0 flex-1 pr-3">
                  <h1 className="font-semibold text-sm truncate leading-tight">
                    <Link
                      to={`/profile/${u._id}`}
                      className="hover:underline text-gray-900 block truncate max-w-[130px]"
                      title={u?.username}
                    >
                      {u?.username}
                    </Link>
                  </h1>
                  <span className="text-gray-500 text-xs block truncate max-w-[130px] mt-0.5">
                    {u?.bio || "Suggested for you"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => followOrUnfollowHandler(u._id)}
                className={`shrink-0 ml-auto pl-3 text-xs font-semibold select-none transition-colors cursor-pointer ${
                  isFollowing
                    ? "text-gray-600 hover:text-red-500"
                    : "text-[#0095F6] hover:text-[#1877F2]"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            </div>
          );
        })
      ) : (
        <p className="text-xs text-gray-400 py-2">No suggested users at the moment</p>
      )}
    </div>
  );
};

export default SuggestedUsers;
