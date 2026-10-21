import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Heart, MessageCircle, Bookmark, Grid, Film, Layers } from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import useGetUserProfile from "@/hooks/useGetUserProfile";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constants";
import { setAuthUser } from "@/redux/authSlice";
import { setSelectedPost } from "@/redux/postSlice";
import { setSelectedUser } from "@/redux/chatSlice";
import CommentDialog from "./CommentDialog";
import { toast } from "sonner";

const Profile = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useGetUserProfile(id);


  const [activeTab, setActiveTab] = useState("posts");
  const [openCommentDialog, setOpenCommentDialog] = useState(false);

  const { user, userProfile } = useSelector((store) => store.auth);
  const { posts } = useSelector((store) => store.post);

  const isLoggedInUser = user?._id === id || user?._id === userProfile?._id;

  const isFollowing = user?.following?.some(
    (fId) => (typeof fId === "object" ? fId?._id : fId) === id
  );

  const followOrUnfollowHandler = async () => {
    try {
      const res = await axios.post(
        `${USER_API_END_POINT}/followorunfollow/${id}`,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        let updatedFollowing;
        if (isFollowing) {
          updatedFollowing = (user?.following || []).filter(
            (fId) => (typeof fId === "object" ? fId?._id : fId) !== id
          );
        } else {
          updatedFollowing = [...(user?.following || []), id];
        }

        dispatch(setAuthUser({ ...user, following: updatedFollowing }));
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update follow status"
      );
    }
  };

  // Helper to extract the primary display media from a post
  const getPostDisplayMedia = (postItem) => {
    if (postItem?.media && postItem.media.length > 0) {
      return postItem.media[0];
    }
    const isVid =
      postItem?.image?.endsWith(".mp4") ||
      postItem?.image?.endsWith(".webm") ||
      postItem?.image?.includes("/video/");
    return {
      url: postItem?.image || "",
      mediaType: isVid ? "video" : "image",
    };
  };

  // Derive author posts from feed posts or populated userProfile posts
  const authorFeedPosts = (posts || []).filter(
    (p) => (p.author?._id || p.author)?.toString() === id?.toString()
  );

  const displayedUserPosts =
    userProfile?.posts?.length > 0 &&
    typeof userProfile.posts[0] === "object" &&
    (userProfile.posts[0]?.image || (userProfile.posts[0]?.media && userProfile.posts[0]?.media?.length > 0))
      ? userProfile.posts
      : authorFeedPosts;

  // Derive bookmarked posts
  const bookmarkedPosts = (posts || []).filter((p) =>
    user?.bookmarks?.some(
      (b) => (typeof b === "object" ? b?._id : b)?.toString() === p._id?.toString()
    )
  );

  const displayedPosts =
    activeTab === "posts" ? displayedUserPosts : bookmarkedPosts;

  const openPostModal = (postItem) => {
    if (!postItem) return;
    const feedMatch = (posts || []).find(
      (p) => (p._id || p.id)?.toString() === (postItem._id || postItem.id)?.toString()
    );
    const enrichedPost = {
      ...(feedMatch || postItem),
      author:
        feedMatch?.author?.username
          ? feedMatch.author
          : typeof postItem.author === "object" && postItem.author?.username
          ? postItem.author
          : userProfile || user,
    };
    dispatch(setSelectedPost(enrichedPost));
    setOpenCommentDialog(true);
  };

  return (
    <div className="flex max-w-5xl justify-center mx-auto my-0 md:my-8 px-0 md:px-4 w-full">
      <div className="flex flex-col gap-2 md:gap-10 w-full max-w-4xl">
        {/* ================= MOBILE PROFILE HEADER (< md) ================= */}
        <div className="md:hidden flex flex-col px-4 pt-3 pb-2 border-b border-gray-100 bg-white">
          {/* Top Row: Avatar on Left + 3 Stats on Right */}
          <div className="flex items-center justify-between gap-6">
            <Avatar className="w-20 h-20 border border-gray-200 shrink-0">
              <AvatarImage
                src={userProfile?.profilePicture}
                alt={userProfile?.username}
              />
              <AvatarFallback className="text-xl font-bold">
                {userProfile?.username?.slice(0, 2).toUpperCase() || "CN"}
              </AvatarFallback>
            </Avatar>

            {/* 3 Stats: Posts, Followers, Following */}
            <div className="flex-1 flex items-center justify-around text-center">
              <div className="flex flex-col">
                <span className="font-bold text-base text-gray-900 leading-tight">
                  {userProfile?.posts?.length ?? displayedUserPosts.length}
                </span>
                <span className="text-xs text-gray-500">posts</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-gray-900 leading-tight">
                  {userProfile?.followers?.length || 0}
                </span>
                <span className="text-xs text-gray-500">followers</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-gray-900 leading-tight">
                  {userProfile?.following?.length || 0}
                </span>
                <span className="text-xs text-gray-500">following</span>
              </div>
            </div>
          </div>

          {/* User Details & Bio */}
          <div className="mt-3 flex flex-col gap-0.5 text-sm">
            <span className="font-bold text-gray-900 leading-tight">
              {userProfile?.username}
            </span>
            {userProfile?.bio && (
              <p className="text-gray-800 text-xs leading-relaxed whitespace-pre-wrap mt-0.5">
                {userProfile.bio}
              </p>
            )}
            <Badge variant="secondary" className="w-fit text-[11px] mt-1 px-2 py-0">
              @{userProfile?.username}
            </Badge>
          </div>

          {/* Action Buttons for Mobile */}
          <div className="mt-3.5 flex items-center gap-2">
            {isLoggedInUser ? (
              <>
                <Link to="/account/edit" className="flex-1">
                  <Button
                    variant="secondary"
                    className="w-full h-8 font-semibold text-xs bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg"
                  >
                    Edit profile
                  </Button>
                </Link>
                <Link to="/account/edit" className="flex-1">
                  <Button
                    variant="secondary"
                    className="w-full h-8 font-semibold text-xs bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg"
                  >
                    Share profile
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button
                  onClick={followOrUnfollowHandler}
                  className={`flex-1 h-8 font-semibold text-xs rounded-lg ${
                    isFollowing
                      ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      : "bg-[#0095F6] text-white hover:bg-[#1877F2]"
                  }`}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
                <Button
                  onClick={handleMessageUser}
                  variant="secondary"
                  className="flex-1 h-8 font-semibold text-xs bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-lg cursor-pointer"
                >
                  Message
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ================= DESKTOP PROFILE HEADER (>= md) ================= */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8 items-center py-6 border-b border-gray-200">
          {/* Avatar column */}
          <div className="flex justify-center md:justify-end md:pr-10">
            <Avatar className="w-32 h-32 md:w-36 md:h-36 border border-gray-200">
              <AvatarImage
                src={userProfile?.profilePicture}
                alt={userProfile?.username}
              />
              <AvatarFallback className="text-3xl font-bold">
                {userProfile?.username?.slice(0, 2).toUpperCase() || "CN"}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* User info & stats column */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {/* Username & Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold text-xl">
                {userProfile?.username}
              </span>

              {isLoggedInUser ? (
                <div className="flex items-center gap-2">
                  <Link to="/account/edit">
                    <Button
                      variant="secondary"
                      className="h-8 font-semibold text-xs px-4 hover:bg-gray-200"
                    >
                      Edit profile
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    className="h-8 font-semibold text-xs px-4 hover:bg-gray-200"
                  >
                    View archive
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={followOrUnfollowHandler}
                    className={`h-8 font-semibold text-xs px-5 ${
                      isFollowing
                        ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        : "bg-[#0095F6] text-white hover:bg-[#1877F2]"
                    }`}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                  <Button
                    onClick={handleMessageUser}
                    variant="secondary"
                    className="h-8 font-semibold text-xs px-4 hover:bg-gray-200 cursor-pointer"
                  >
                    Message
                  </Button>
                </div>
              )}
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-8 text-sm">
              <p>
                <span className="font-bold mr-1">
                  {userProfile?.posts?.length ?? displayedUserPosts.length}
                </span>
                posts
              </p>
              <p>
                <span className="font-bold mr-1">
                  {userProfile?.followers?.length || 0}
                </span>
                followers
              </p>
              <p>
                <span className="font-bold mr-1">
                  {userProfile?.following?.length || 0}
                </span>
                following
              </p>
            </div>

            {/* Bio & Details */}
            <div className="text-sm flex flex-col gap-1">
              <span className="font-bold">{userProfile?.username}</span>
              <p className="text-gray-700 whitespace-pre-wrap">
                {userProfile?.bio || "Bio here..."}
              </p>
              <Badge variant="secondary" className="w-fit text-xs mt-1">
                @{userProfile?.username}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-gray-200 md:-mt-6">
          <div className="flex justify-center gap-12 text-xs font-semibold tracking-wider uppercase text-gray-500">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex items-center gap-1.5 py-3 border-t cursor-pointer transition-colors ${
                activeTab === "posts"
                  ? "border-black text-black"
                  : "border-transparent hover:text-gray-700"
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Posts</span>
            </button>

            {isLoggedInUser && (
              <button
                onClick={() => setActiveTab("saved")}
                className={`flex items-center gap-1.5 py-3 border-t cursor-pointer transition-colors ${
                  activeTab === "saved"
                    ? "border-black text-black"
                    : "border-transparent hover:text-gray-700"
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>Saved</span>
              </button>
            )}
          </div>
        </div>

        {/* Posts Grid: Seamless 3 Posts in a row on phone, gap-0.5 */}
        <div className="grid grid-cols-3 gap-[1.5px] md:gap-4 w-full">
          {displayedPosts && displayedPosts.length > 0 ? (
            displayedPosts.map((postItem, idx) => {
              const firstMedia = getPostDisplayMedia(postItem);
              const isVideo = firstMedia.mediaType === "video";
              const isCarousel = (postItem?.media?.length || 0) > 1;

              return (
                <div
                  key={postItem?._id || `profile-post-${idx}`}
                  onClick={() => openPostModal(postItem)}
                  className="relative group aspect-square bg-gray-100 cursor-pointer overflow-hidden rounded-sm select-none"
                >
                  {isVideo ? (
                    <video
                      src={firstMedia.url}
                      className="w-full h-full object-cover pointer-events-none"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={firstMedia.url}
                      alt="post"
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  )}

                  {/* Multi-item or Video indicator in top-right */}
                  {isVideo ? (
                    <div className="absolute top-2 right-2 text-white drop-shadow p-1 pointer-events-none">
                      <Film className="w-4 h-4 fill-white text-white" />
                    </div>
                  ) : isCarousel ? (
                    <div className="absolute top-2 right-2 text-white drop-shadow p-1 pointer-events-none">
                      <Layers className="w-4 h-4 fill-white text-white" />
                    </div>
                  ) : null}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex items-center text-white font-bold gap-1 text-sm">
                      <Heart className="w-5 h-5 fill-white" />
                      <span>{postItem?.likes?.length || 0}</span>
                    </div>
                    <div className="flex items-center text-white font-bold gap-1 text-sm">
                      <MessageCircle className="w-5 h-5 fill-white" />
                      <span>{postItem?.comments?.length || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <p className="text-base font-semibold">
                {activeTab === "posts" ? "No posts yet" : "No saved posts yet"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {activeTab === "posts"
                  ? "When photos are shared, they'll appear here."
                  : "Save photos that you want to see again."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Post Modal */}
      <CommentDialog
        open={openCommentDialog}
        setOpen={setOpenCommentDialog}
      />
    </div>
  );
};

export default Profile;
