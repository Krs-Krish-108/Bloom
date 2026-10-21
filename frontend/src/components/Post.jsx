import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "./ui/dialog";
import { Button } from "./ui/button";
import {
  MoreHorizontal,
  MessageCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Film,
  Smile,
  X,
  Sparkles,
  Music,
  Volume2,
  VolumeX,
} from "lucide-react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import CommentDialog from "./CommentDialog";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import axios from "axios";
import { POST_API_END_POINT } from "@/utils/constants";
import { setPosts, setSelectedPost, updatePostLikes } from "@/redux/postSlice";
import { setAuthUser } from "@/redux/authSlice";
import { Link } from "react-router-dom";
import { useFeedAudio } from "@/context/FeedAudioContext";

// Curated list of ~60 smileys, hearts, and stars
const CURATED_EMOJIS = [
  // Smileys & expressions (36)
  "😀", "😃", "😄", "😁", "😆", "🥹", "😅", "😂", "🤣", "🥲", "☺️", "😊",
  "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋",
  "😛", "😜", "🤪", "😝", "🤗", "🤭", "🫢", "🫣", "🤫", "🤔", "🥳", "😎",
  // Hearts (16)
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💖", "💗", "💓",
  "💞", "💕", "💘", "💝",
  // Stars & Celebration (12)
  "⭐", "🌟", "✨", "💫", "🌠", "🌌", "🪄", "🎂", "🎈", "🎉", "🎊", "🎁"
];

const Post = ({ post }) => {
  const postRef = useRef(null);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);
  const { posts } = useSelector((store) => store.post);
  const {
    activePostId,
    isPlaying,
    isMuted,
    toggleMute,
    playPostMusic,
    registerPost,
    unregisterPost,
    setVideoPlaying,
  } = useFeedAudio();

  // Register this post element for horizontal midline viewport scroll detection
  useEffect(() => {
    if (postRef.current && post?._id && registerPost) {
      registerPost(post._id, postRef.current, post.music || null);
    }
    return () => {
      if (post?._id && unregisterPost) {
        unregisterPost(post._id);
      }
    };
  }, [post?._id, post?.music, registerPost, unregisterPost]);

  const isLiked = Boolean(
    post?.likes?.some(
      (id) => (typeof id === "object" ? id?._id || id : id)?.toString() === user?._id?.toString()
    )
  );
  const postLike = post?.likes?.length || 0;
  const [comments, setComments] = useState(post?.comments || []);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);

  const authorUsername = post?.author?.username || "username";
  const authorAvatar = post?.author?.profilePicture || "";
  const authorId = post?.author?._id?.toString() || post?.author?.toString() || "";
  const isPostAuthor = user?._id?.toString() === authorId;
  const isAdmin = Boolean(user?.isAdmin);

  // Video Privacy Rule: Any uploaded video in a carousel is visible to the author and to the Admin!
  const rawMediaList =
    post?.media && post.media.length > 0
      ? post.media.map((m) => ({
          ...m,
          originalUrl: m.originalUrl || (post.media.length === 1 ? post.originalImage : "") || "",
        }))
      : post?.image
      ? [
          {
            url: post.image,
            originalUrl: post.originalImage || post.image,
            mediaType: "image",
          },
        ]
      : [];

  const mediaList = rawMediaList.filter((item) => {
    if (item.mediaType === "video") {
      return isPostAuthor || isAdmin;
    }
    return true;
  });

  const currentMedia = mediaList[currentSlide] || mediaList[0];

  const isBookmarked = user?.bookmarks?.some(
    (bId) => (typeof bId === "object" ? bId?._id : bId) === post?._id
  );

  const changeEventHandler = (e) => {
    setText(e.target.value);
  };

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const likeOrDislikeHandler = async () => {
    if (!user) {
      toast.error("Please login to like posts");
      return;
    }

    const action = isLiked ? "dislike" : "like";
    const userIdStr = user._id.toString();

    // Optimistically update likes in Redux
    const newLikes = isLiked
      ? (post.likes || []).filter(
          (id) => (typeof id === "object" ? id?._id || id : id)?.toString() !== userIdStr
        )
      : [...(post.likes || []), user._id];

    dispatch(updatePostLikes({ postId: post._id, likes: newLikes }));

    try {
      const res = await axios.get(
        `${POST_API_END_POINT}/${post._id}/${action}`,
        { withCredentials: true }
      );

      if (res.data.success && res.data.post) {
        dispatch(updatePostLikes({ postId: post._id, likes: res.data.post.likes }));
      }
    } catch (error) {
      // Revert on failure
      dispatch(updatePostLikes({ postId: post._id, likes: post.likes || [] }));
      toast.error(error.response?.data?.message || "Like action failed");
    }
  };

  const commentHandler = async () => {
    if (!text.trim()) return;

    try {
      const res = await axios.post(
        `${POST_API_END_POINT}/${post._id}/comment`,
        { text: text.trim() },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        const updatedCommentData = [...comments, res.data.comment];
        setComments(updatedCommentData);

        const updatedPostData = posts.map((p) =>
          p._id === post._id ? { ...p, comments: updatedCommentData } : p
        );
        dispatch(setPosts(updatedPostData));

        setText("");
        toast.success(res.data.message || "Comment added successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add comment");
    }
  };

  const deletePostHandler = async () => {
    try {
      const res = await axios.delete(
        `${POST_API_END_POINT}/delete/${post?._id}`,
        { withCredentials: true }
      );

      if (res.data.success) {
        const updatedPostData = posts.filter((p) => p._id !== post?._id);
        dispatch(setPosts(updatedPostData));
        toast.success(res.data.message || "Post deleted successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete post");
    }
  };

  const bookmarkHandler = async () => {
    try {
      const res = await axios.get(
        `${POST_API_END_POINT}/${post?._id}/bookmark`,
        { withCredentials: true }
      );

      if (res.data.success) {
        let updatedBookmarks;
        const currentBookmarks = user?.bookmarks || [];

        if (res.data.type === "saved") {
          updatedBookmarks = [...currentBookmarks, post?._id];
        } else {
          updatedBookmarks = currentBookmarks.filter((b) => {
            const id = typeof b === "object" ? b?._id : b;
            return id !== post?._id;
          });
        }

        dispatch(setAuthUser({ ...user, bookmarks: updatedBookmarks }));
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Bookmark action failed");
    }
  };

  const openCommentDialogHandler = () => {
    dispatch(setSelectedPost(post));
    setOpen(true);
  };

  return (
    <div ref={postRef} className="mb-4 w-full max-w-[470px] mx-auto bg-white border-b border-neutral-200/80 pb-4">
      {/* Post Header: Avatar, Username, 3-dots Menu */}
      <div className="flex items-center justify-between py-2 px-0.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link to={`/profile/${authorId}`} className="shrink-0">
            <Avatar className="w-8 h-8">
              <AvatarImage src={authorAvatar} alt="author_avatar" />
              <AvatarFallback>
                {authorUsername.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to={`/profile/${authorId}`}
                className="font-semibold text-sm hover:underline leading-tight truncate"
              >
                {authorUsername}
              </Link>
              {post?.style && (
                <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200/70 px-2 py-0.5 rounded-full font-medium shrink-0">
                  {post.style}
                </span>
              )}
            </div>
            {post?.isAiLabel && (
              <span className="text-[11px] text-gray-500 font-normal flex items-center gap-1 mt-0.5">
                <span className="text-[10px]">✨</span> AI info
              </span>
            )}
            {/* Instagram Music Badge */}
            {post?.music?.trackName && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (activePostId === post._id) {
                    toggleMute?.();
                  } else {
                    playPostMusic?.(post._id, post.music);
                  }
                }}
                className="flex items-center gap-1.5 text-[11px] text-neutral-600 font-medium mt-0.5 truncate max-w-[260px] cursor-pointer hover:text-black transition-colors"
                title="Click to play / mute audio"
              >
                <Music className="w-3 h-3 text-rose-500 shrink-0" />
                <span className="truncate">
                  {post.music.trackName} • {post.music.artistName}
                </span>
                {activePostId === post._id && isPlaying && !isMuted && (
                  <div className="flex items-end gap-0.5 h-2.5 ml-0.5 shrink-0">
                    <span className="w-0.5 h-2 bg-rose-500 animate-pulse" />
                    <span className="w-0.5 h-1 bg-rose-500 animate-pulse delay-75" />
                    <span className="w-0.5 h-2.5 bg-rose-500 animate-pulse delay-150" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin "View Original" / "View Edited" toggle button */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                const hasOriginal =
                  mediaList.some((m) => m.originalUrl) || Boolean(post?.originalImage);
                if (!hasOriginal) {
                  toast.info("Original photo is not stored for this post.");
                }
                setShowOriginal((prev) => !prev);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm border cursor-pointer ${
                showOriginal
                  ? "bg-purple-600 text-white border-purple-700 hover:bg-purple-700 ring-2 ring-purple-300"
                  : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
              }`}
              title={
                showOriginal
                  ? "Switch all photos in this post to Edited Art"
                  : "Switch all photos in this post to Original Photos"
              }
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showOriginal ? "View Edited" : "View Original"}</span>
            </button>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <MoreHorizontal className="cursor-pointer hover:text-gray-600 text-gray-500" />
            </DialogTrigger>
            <DialogContent className="flex flex-col items-center text-sm text-center">
              {isPostAuthor || isAdmin ? (
                <Button
                  variant="ghost"
                  onClick={deletePostHandler}
                  className="cursor-pointer w-full text-[#ED4956] font-bold"
                >
                  {isAdmin && !isPostAuthor ? "Delete Post (Admin)" : "Delete"}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="cursor-pointer w-full text-[#ED4956] font-bold"
                >
                  Unfollow
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={bookmarkHandler}
                className="cursor-pointer w-full"
              >
                {isBookmarked ? "Remove from bookmarks" : "Add to favorites"}
              </Button>
              <DialogClose asChild>
                <Button variant="ghost" className="cursor-pointer w-full">
                  Cancel
                </Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Post Media: Multi-Media Carousel or Single Image/Video */}
      <div className="relative w-full aspect-square bg-neutral-900/5 flex items-center justify-center overflow-hidden select-none rounded-[4px] border border-neutral-100/80">
        {currentMedia?.mediaType === "video" ? (
          <video
            src={currentMedia.url}
            className={`w-full h-full ${
              post?.cropRatio === "original" ? "object-contain" : "object-cover"
            }`}
            controls
            playsInline
            loop
            onPlay={() => setVideoPlaying?.(post._id, true)}
            onPause={() => setVideoPlaying?.(post._id, false)}
            onEnded={() => setVideoPlaying?.(post._id, false)}
          />
        ) : (
          <img
            className={`w-full h-full ${
              post?.cropRatio === "original" ? "object-contain" : "object-cover"
            }`}
            src={
              showOriginal && (currentMedia?.originalUrl || post?.originalImage)
                ? currentMedia.originalUrl || post.originalImage
                : currentMedia?.url || post?.image
            }
            alt="post_media"
          />
        )}

        {/* Audio Mute / Unmute Toggle Button for Post Music */}
        {post?.music?.previewUrl && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (activePostId === post._id) {
                toggleMute?.();
              } else {
                playPostMusic?.(post._id, post.music);
              }
            }}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/65 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/85 transition-transform active:scale-90 z-20 shadow cursor-pointer"
            title={activePostId === post._id && !isMuted ? "Mute post music" : "Play post music"}
            aria-label={activePostId === post._id && !isMuted ? "Mute post music" : "Play post music"}
          >
            {activePostId === post._id && !isMuted && isPlaying ? (
              <Volume2 className="w-4 h-4 text-white" />
            ) : (
              <VolumeX className="w-4 h-4 text-white/90" />
            )}
          </button>
        )}

        {/* Admin Original Photo Indicator Badge */}
        {showOriginal && currentMedia?.mediaType !== "video" && (
          <div className="absolute top-2.5 right-2.5 bg-purple-700/80 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded shadow flex items-center gap-1 font-semibold z-10 border border-purple-400/40 pointer-events-none">
            <span>👁️</span>
            <span>Original Photo (Admin)</span>
          </div>
        )}

        {/* Video Privacy Badge for Author or Admin */}
        {currentMedia?.mediaType === "video" && (
          <div className="absolute top-2.5 left-2.5 bg-black/65 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded shadow flex items-center gap-1 font-medium z-10 border border-white/10 pointer-events-none">
            <span>🔒</span>
            <span>
              {isPostAuthor
                ? "Only you can see this video"
                : "Admin view (Author video)"}
            </span>
          </div>
        )}

        {/* Happy Birthday Badge on Post Media */}
        {post?.isBirthdayTag && (
          <div className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-md shadow-md flex items-center gap-1.5 font-medium z-10 border border-white/10 pointer-events-none">
            <span>🎉</span>
            <span>Happy Birthday! 🎂</span>
          </div>
        )}

        {/* Carousel slide indicators and navigation */}
        {mediaList.length > 1 && (
          <>
            {/* Slide counter badge */}
            <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded-full font-medium z-10">
              {currentSlide + 1}/{mediaList.length}
            </div>

            {/* Left arrow button */}
            {currentSlide > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide((prev) => prev - 1);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10 shadow"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Right arrow button */}
            {currentSlide < mediaList.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide((prev) => prev + 1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10 shadow"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Pagination dots at bottom */}
            <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
              {mediaList.map((_, dotIdx) => (
                <div
                  key={dotIdx}
                  className={`h-1.5 rounded-full transition-all ${
                    currentSlide === dotIdx
                      ? "w-4 bg-sky-500"
                      : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Post Actions: Heart, Message, Send, Bookmark */}
      <div className="pt-2.5 px-0.5 pb-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {isLiked ? (
              <FaHeart
                onClick={likeOrDislikeHandler}
                size={"22px"}
                className="cursor-pointer text-red-600 transition-transform active:scale-125"
              />
            ) : (
              <FaRegHeart
                onClick={likeOrDislikeHandler}
                size={"22px"}
                className="cursor-pointer hover:text-gray-600 transition-transform active:scale-125"
              />
            )}
            <MessageCircle
              onClick={openCommentDialogHandler}
              className="cursor-pointer hover:text-gray-600"
            />
          </div>

          <Bookmark
            onClick={bookmarkHandler}
            className={`cursor-pointer transition-colors ${
              isBookmarked
                ? "text-black fill-black"
                : "hover:text-gray-600 text-gray-700"
            }`}
          />
        </div>

        {/* Likes Count */}
        <span className="font-semibold text-sm block mb-1">
          {postLike} {postLike === 1 ? "like" : "likes"}
        </span>

        {/* Caption */}
        {post?.caption && (
          <p className="text-sm mb-1">
            <span className="font-semibold mr-2">{authorUsername}</span>
            {post.caption}
          </p>
        )}

        {/* Comments Count & Dialog Link */}
        {comments.length > 0 && (
          <span
            onClick={openCommentDialogHandler}
            className="cursor-pointer text-sm text-gray-400 hover:underline block mb-2"
          >
            View all {comments.length} comments
          </span>
        )}

        {/* Comment Dialog Modal */}
        <CommentDialog open={open} setOpen={setOpen} />

        {/* Inline Comment Input */}
        <div className="relative flex items-center gap-2.5 border-t border-gray-100 pt-2.5 mt-2">
          {/* Emoji Button */}
          <div className="relative shrink-0 flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPicker((prev) => !prev);
              }}
              className={`text-gray-500 hover:text-gray-800 cursor-pointer p-0.5 rounded transition-colors ${
                showEmojiPicker ? "text-[#0095F6]" : ""
              }`}
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Emoji Popover Picker */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-9 left-0 w-64 bg-white border border-gray-200 shadow-2xl rounded-xl p-2.5 z-40 animate-in fade-in zoom-in-95"
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                    Smileys, Hearts & Stars
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-1 max-h-44 overflow-y-auto pr-1">
                  {CURATED_EMOJIS.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setText((prev) => prev + emoji);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-neutral-100 rounded-lg cursor-pointer transition-transform active:scale-125 select-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Vertical subtle divider (not touching top or bottom) */}
          <div className="h-4 w-[1px] bg-gray-200 shrink-0" />

          {/* Comment Input */}
          <input
            type="text"
            placeholder="Add a comment..."
            value={text}
            onChange={changeEventHandler}
            onKeyDown={(e) => {
              if (e.key === "Enter") commentHandler();
            }}
            className="outline-none text-sm w-full placeholder:text-gray-400 bg-transparent text-gray-900"
          />

          {text.trim() && (
            <span
              onClick={commentHandler}
              className="text-[#0095F6] cursor-pointer font-bold text-sm select-none hover:text-[#1877F2] shrink-0"
            >
              Post
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Post;
