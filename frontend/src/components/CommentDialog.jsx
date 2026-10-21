import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Link } from "react-router-dom";
import {
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Smile,
  Heart,
  MessageCircle,
  Bookmark,
  Sparkles,
} from "lucide-react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { POST_API_END_POINT } from "@/utils/constants";
import { setPosts, setSelectedPost, updatePostLikes } from "@/redux/postSlice";
import { setAuthUser } from "@/redux/authSlice";

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

// Helper to highlight hashtags in blue (#hashtag)
const renderFormattedCaption = (captionText) => {
  if (!captionText) return null;
  const tokens = captionText.split(/(\s+|#[\w\d_]+)/g);
  return tokens.map((token, index) => {
    if (token.startsWith("#")) {
      return (
        <span
          key={index}
          className="text-[#00376B] font-normal hover:underline cursor-pointer"
        >
          {token}
        </span>
      );
    }
    return token;
  });
};

const CommentDialog = ({ open, setOpen }) => {
  const [text, setText] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [commentLikes, setCommentLikes] = useState({});

  const commentInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);
  const { selectedPost, posts } = useSelector((store) => store.post);

  const authorId = selectedPost?.author?._id?.toString() || selectedPost?.author?.toString() || "";
  const isPostAuthor = user?._id?.toString() === authorId;
  const isAdmin = Boolean(user?.isAdmin);

  // Normalize media items from post.media, post.image, or pin.mediaUrl
  const rawMediaList =
    selectedPost?.media && selectedPost.media.length > 0
      ? selectedPost.media.map((m) => ({
          ...m,
          originalUrl: m.originalUrl || (selectedPost.media.length === 1 ? selectedPost.originalImage : "") || "",
        }))
      : selectedPost?.image
      ? [
          {
            url: selectedPost.image,
            originalUrl: selectedPost.originalImage || selectedPost.image,
            mediaType:
              selectedPost.image.endsWith(".mp4") ||
              selectedPost.image.endsWith(".webm") ||
              selectedPost.image.includes("/video/")
                ? "video"
                : "image",
          },
        ]
      : selectedPost?.mediaUrl
      ? [
          {
            url: selectedPost.mediaUrl,
            mediaType:
              selectedPost.mediaType ||
              (selectedPost.mediaUrl.endsWith(".mp4") || selectedPost.mediaUrl.includes("/video/")
                ? "video"
                : "image"),
          },
        ]
      : [];

  const mediaList =
    rawMediaList.length > 0
      ? rawMediaList
      : selectedPost?.image
      ? [{ url: selectedPost.image, mediaType: "image" }]
      : selectedPost?.mediaUrl
      ? [{ url: selectedPost.mediaUrl, mediaType: selectedPost?.mediaType || "image" }]
      : [];

  const currentMedia =
    mediaList[currentSlide] ||
    mediaList[0] || {
      url: selectedPost?.image || selectedPost?.mediaUrl || "",
      mediaType: "image",
    };
  const commentList = selectedPost?.comments || [];

  // Post to post navigation across the feed/profile post list
  const postIndex = (posts || []).findIndex(
    (p) => (p._id || p.id)?.toString() === (selectedPost?._id || selectedPost?.id)?.toString()
  );
  const hasPrevPost = postIndex > 0;
  const hasNextPost = postIndex !== -1 && postIndex < (posts || []).length - 1;

  const goToPrevPost = (e) => {
    e?.stopPropagation();
    if (hasPrevPost) {
      dispatch(setSelectedPost(posts[postIndex - 1]));
      setCurrentSlide(0);
    }
  };

  const goToNextPost = (e) => {
    e?.stopPropagation();
    if (hasNextPost) {
      dispatch(setSelectedPost(posts[postIndex + 1]));
      setCurrentSlide(0);
    }
  };

  const isLiked = Boolean(
    selectedPost?.likes?.some(
      (id) => (typeof id === "object" ? id?._id || id : id)?.toString() === user?._id?.toString()
    )
  );
  const likeCount = selectedPost?.likes?.length || 0;

  const isBookmarked = user?.bookmarks?.some(
    (bId) => (typeof bId === "object" ? bId?._id : bId) === selectedPost?._id
  );

  const authorUsername = selectedPost?.author?.username || "username";
  const authorAvatar = selectedPost?.author?.profilePicture || "";

  // Reset slide and original toggle when post changes
  useEffect(() => {
    setCurrentSlide(selectedPost?.initialSlide || 0);
    setReplyingTo(null);
    setText("");
    setShowEmojiPicker(false);
    setShowOriginal(Boolean(selectedPost?.showOriginalByDefault));
  }, [selectedPost?._id, selectedPost?.initialSlide, selectedPost?.showOriginalByDefault]);

  // Close emoji picker on outside click & escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (!open || !selectedPost) return null;

  // Like or dislike post from comment modal
  const likeOrDislikeHandler = async () => {
    if (!user) return;
    const isSeed = selectedPost._id?.toString().startsWith("seed-");
    const userIdStr = user._id.toString();

    const newLikes = isLiked
      ? (selectedPost.likes || []).filter(
          (id) => (typeof id === "object" ? id?._id || id : id)?.toString() !== userIdStr
        )
      : [...(selectedPost.likes || []), user._id];

    if (isSeed) {
      dispatch(setSelectedPost({ ...selectedPost, likes: newLikes }));
      return;
    }

    try {
      const action = isLiked ? "dislike" : "like";

      // Optimistically update in Redux
      dispatch(updatePostLikes({ postId: selectedPost._id, likes: newLikes }));

      const res = await axios.get(`${POST_API_END_POINT}/${selectedPost._id}/${action}`, {
        withCredentials: true,
      });

      if (res.data.success && res.data.post) {
        dispatch(updatePostLikes({ postId: selectedPost._id, likes: res.data.post.likes }));
      }
    } catch (error) {
      console.error("Like error:", error);
      dispatch(updatePostLikes({ postId: selectedPost._id, likes: selectedPost.likes || [] }));
    }
  };

  // Bookmark handler
  const bookmarkHandler = async () => {
    const isSeed = selectedPost._id?.toString().startsWith("seed-");
    if (isSeed) {
      toast.success("Saved to your Pinterest board!");
      return;
    }

    try {
      const res = await axios.get(
        `${POST_API_END_POINT}/${selectedPost?._id}/bookmark`,
        { withCredentials: true }
      );

      if (res.data.success) {
        let updatedBookmarks;
        const currentBookmarks = user?.bookmarks || [];

        if (res.data.type === "saved") {
          updatedBookmarks = [...currentBookmarks, selectedPost?._id];
        } else {
          updatedBookmarks = currentBookmarks.filter((b) => {
            const id = typeof b === "object" ? b?._id : b;
            return id !== selectedPost?._id;
          });
        }

        dispatch(setAuthUser({ ...user, bookmarks: updatedBookmarks }));
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Bookmark action failed");
    }
  };

  // Reply button handler
  const handleReplyClick = (targetUsername) => {
    if (!targetUsername) return;
    setReplyingTo(targetUsername);
    setText(`@${targetUsername} `);
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
        const len = commentInputRef.current.value.length;
        commentInputRef.current.setSelectionRange(len, len);
      }
    }, 50);
  };

  // Add emoji to comment text
  const addEmojiHandler = (emoji) => {
    setText((prev) => prev + emoji);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  // Submit comment
  const sendMessageHandler = async () => {
    if (!text.trim() || !selectedPost?._id) return;

    if (selectedPost._id?.toString().startsWith("seed-")) {
      const newComment = {
        _id: `seed-c-${Date.now()}`,
        text: text.trim(),
        author: {
          username: user?.username || "you",
          profilePicture: user?.profilePicture || "",
        },
      };
      const updatedComments = [...commentList, newComment];
      dispatch(setSelectedPost({ ...selectedPost, comments: updatedComments }));
      setText("");
      setReplyingTo(null);
      setShowEmojiPicker(false);
      toast.success("Comment added");
      return;
    }

    try {
      const res = await axios.post(
        `${POST_API_END_POINT}/${selectedPost._id}/comment`,
        { text: text.trim() },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        const newComment = res.data.comment;
        const updatedComments = [...commentList, newComment];

        // Update selectedPost in Redux
        const updatedSelectedPost = {
          ...selectedPost,
          comments: updatedComments,
        };
        dispatch(setSelectedPost(updatedSelectedPost));

        // Update posts feed in Redux
        const updatedPosts = posts.map((p) =>
          p._id === selectedPost._id ? updatedSelectedPost : p
        );
        dispatch(setPosts(updatedPosts));

        setText("");
        setReplyingTo(null);
        setShowEmojiPicker(false);
        toast.success(res.data.message || "Comment added");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add comment");
    }
  };

  const nextSlide = () => {
    if (currentSlide < mediaList.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  // Toggle individual comment heart like (client optimistic state)
  const toggleCommentLike = (commentId) => {
    setCommentLikes((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  if (!open || !selectedPost) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => {
          setOpen(false);
          dispatch(setSelectedPost(null));
        }}
      />

      {/* Outside Top-Right Close Button (Desktop only) */}
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          dispatch(setSelectedPost(null));
        }}
        className="hidden md:flex fixed top-5 right-5 w-10 h-10 rounded-full bg-black/75 hover:bg-black text-white items-center justify-center z-[70] transition-all hover:scale-110 shadow-xl cursor-pointer"
        aria-label="Close"
        title="Close post view"
      >
        <X className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Left-Right Post Navigation Buttons across posts list (Desktop only) */}
      {hasPrevPost && (
        <button
          type="button"
          onClick={goToPrevPost}
          className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-neutral-900 shadow-2xl items-center justify-center transition-all hover:scale-110 z-[60] cursor-pointer"
          aria-label="Previous Post"
          title="Previous Post"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {hasNextPost && (
        <button
          type="button"
          onClick={goToNextPost}
          className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-neutral-900 shadow-2xl items-center justify-center transition-all hover:scale-110 z-[60] cursor-pointer"
          aria-label="Next Post"
          title="Next Post"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Main Comment Box: On mobile it is a pure Comment drawer/sheet (Image hidden, only comments visible) */}
      <div
        onClick={(e) => {
          if (showEmojiPicker) setShowEmojiPicker(false);
        }}
        className="relative z-50 w-full md:w-[920px] max-w-full md:max-w-[95vw] h-[82vh] md:h-[600px] bg-white rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100 animate-in slide-in-from-bottom-6 md:zoom-in-95 duration-200"
      >
        {/* ================= LEFT COLUMN: MEDIA WITH AMBIENT BLUR (DESKTOP ONLY) ================= */}
        <div className="hidden md:flex relative w-[580px] h-[600px] bg-black items-center justify-center overflow-hidden border-r border-gray-200 select-none shrink-0">
          {/* Ambient Blur Background Reflection (YouTube / Instagram style) */}
          {currentMedia?.mediaType === "video" ? (
            <video
              src={currentMedia.url}
              className="absolute inset-0 w-full h-full object-cover filter blur-2xl scale-125 opacity-70 pointer-events-none brightness-75"
              muted
              loop
              autoPlay
              playsInline
            />
          ) : (
            <img
              src={currentMedia?.url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover filter blur-2xl scale-125 opacity-70 pointer-events-none brightness-75"
            />
          )}

          {/* Foreground Sharp Media */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            {currentMedia?.mediaType === "video" ? (
              <video
                src={currentMedia.url}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
                loop
              />
            ) : (
              <img
                src={
                  showOriginal && (currentMedia?.originalUrl || selectedPost?.originalImage)
                    ? currentMedia.originalUrl || selectedPost.originalImage
                    : currentMedia?.url || selectedPost?.image
                }
                alt="post_media"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Author Video Privacy Badge */}
          {currentMedia?.mediaType === "video" && isPostAuthor && (
            <div className="absolute top-4 left-4 bg-black/65 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5 font-medium z-20 pointer-events-none border border-white/10">
              <span>🔒</span>
              <span>Only you can see this video</span>
            </div>
          )}

          {/* Happy Birthday Badge on Bottom-Left if toggled */}
          {selectedPost?.isBirthdayTag && (
            <div className="absolute bottom-4 left-4 bg-black/65 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 font-medium z-20 pointer-events-none border border-white/10 animate-in fade-in zoom-in-95">
              <span>🎉</span>
              <span className="tracking-wide">Happy Birthday! 🎂</span>
            </div>
          )}

          {/* Carousel Arrows if multiple items */}
          {mediaList.length > 1 && (
            <>
              {currentSlide > 0 && (
                <button
                  type="button"
                  onClick={prevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all z-20 shadow-md cursor-pointer"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {currentSlide < mediaList.length - 1 && (
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all z-20 shadow-md cursor-pointer"
                  aria-label="Next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Slide Counter Badge */}
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium z-20">
                {currentSlide + 1}/{mediaList.length}
              </div>

              {/* Pagination Dots */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-none">
                {mediaList.map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      currentSlide === idx ? "bg-white scale-125 shadow" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ================= RIGHT COLUMN: AUTHOR, COMMENTS, ACTIONS & INPUT ================= */}
        <div className="w-full md:w-[340px] flex-1 md:h-[600px] flex flex-col justify-between bg-white overflow-hidden min-w-0">
          {/* Mobile Top Grab Handle */}
          <div className="md:hidden pt-2.5 pb-1 bg-white flex justify-center shrink-0">
            <div className="w-10 h-1 bg-neutral-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="p-3 md:p-3.5 px-4 flex items-center justify-between border-b border-gray-100 select-none bg-white shrink-0">
            <div className="flex items-center gap-3">
              {/* On phone: Display 'Comments' title */}
              <span className="md:hidden font-bold text-base text-gray-900">Comments</span>

              {/* On desktop: Display Author avatar & username */}
              <div className="hidden md:flex items-center gap-3">
                <Link to={`/profile/${authorId}`}>
                  <Avatar className="w-8 h-8 border border-gray-200">
                    <AvatarImage src={authorAvatar} />
                    <AvatarFallback className="font-semibold text-xs">
                      {authorUsername.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/profile/${authorId}`}
                      className="font-semibold text-sm text-gray-900 hover:underline leading-tight"
                    >
                      {authorUsername}
                    </Link>
                    {selectedPost?.style && (
                      <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200/70 px-2 py-0.5 rounded-full font-medium">
                        {selectedPost.style}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const hasOriginal =
                      mediaList.some((m) => m.originalUrl) || Boolean(selectedPost?.originalImage);
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
                      ? "Switch all photos to Edited Art"
                      : "Switch all photos to Original Photos"
                  }
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{showOriginal ? "View Edited" : "View Original"}</span>
                </button>
              )}
              <MoreHorizontal className="hidden md:block w-5 h-5 cursor-pointer hover:text-gray-600 text-gray-500" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  dispatch(setSelectedPost(null));
                }}
                className="p-1 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close"
                aria-label="Close comments"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Scrollable Middle: Author Caption + Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Author Caption Row */}
            {selectedPost?.caption && (
              <div className="flex items-start gap-3">
                <Link to={`/profile/${authorId}`} className="shrink-0 mt-0.5">
                  <Avatar className="w-8 h-8 border border-gray-200">
                    <AvatarImage src={authorAvatar} />
                    <AvatarFallback className="font-semibold text-xs">
                      {authorUsername.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="text-sm text-gray-900 leading-snug break-words flex-1">
                  <Link
                    to={`/profile/${authorId}`}
                    className="font-semibold mr-1.5 hover:underline"
                  >
                    {authorUsername}
                  </Link>
                  <span>{renderFormattedCaption(selectedPost.caption)}</span>
                </div>
              </div>
            )}

            {/* Comments List */}
            {commentList && commentList.length > 0 ? (
              commentList.map((c, idx) => {
                const commentId = c?._id || `c-${idx}`;
                const commenterName = c?.author?.username || "user";
                const isCommentLiked = commentLikes[commentId] || false;

                return (
                  <div key={commentId} className="flex items-start justify-between gap-2 group">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="w-8 h-8 shrink-0 border border-gray-200 mt-0.5">
                        <AvatarImage src={c?.author?.profilePicture} />
                        <AvatarFallback className="font-semibold text-xs">
                          {commenterName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm leading-snug break-words flex-1">
                        <div>
                          <span className="font-semibold mr-1.5 text-gray-900">
                            {commenterName}
                          </span>
                          <span className="text-gray-800">{c?.text}</span>
                        </div>

                        {/* Reply Button below comment */}
                        <div className="mt-1 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleReplyClick(commenterName)}
                            className="text-xs text-gray-500 font-semibold hover:text-gray-900 cursor-pointer transition-colors"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Small Comment Heart Button */}
                    <button
                      type="button"
                      onClick={() => toggleCommentLike(commentId)}
                      className="text-gray-400 hover:text-red-500 cursor-pointer pt-1 transition-colors"
                      title="Like comment"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isCommentLiked ? "fill-red-500 text-red-500" : ""
                        }`}
                      />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>

          {/* Bottom Actions & Likes Row */}
          <div className="border-t border-gray-100 p-3.5 px-4 bg-white shrink-0">
            {/* Action Buttons: Like, Comment, Share, Bookmark */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Like Button */}
                <button
                  type="button"
                  onClick={likeOrDislikeHandler}
                  className="cursor-pointer hover:opacity-70 transition-opacity"
                  title="Like"
                >
                  {isLiked ? (
                    <FaHeart className="w-6 h-6 text-[#ED4956]" />
                  ) : (
                    <FaRegHeart className="w-6 h-6 text-gray-800" />
                  )}
                </button>

                {/* Comment Button (focuses input) */}
                <button
                  type="button"
                  onClick={() => commentInputRef.current?.focus()}
                  className="cursor-pointer hover:opacity-70 transition-opacity"
                  title="Comment"
                >
                  <MessageCircle className="w-6 h-6 text-gray-800" />
                </button>
              </div>

              {/* Bookmark Button */}
              <button
                type="button"
                onClick={bookmarkHandler}
                className="cursor-pointer hover:opacity-70 transition-opacity"
                title="Bookmark"
              >
                <Bookmark
                  className={`w-6 h-6 ${
                    isBookmarked ? "fill-black text-black" : "text-gray-800"
                  }`}
                />
              </button>
            </div>

            {/* Likes Count */}
            <p className="font-semibold text-sm text-gray-900 mt-2 select-none">
              {likeCount.toLocaleString()} {likeCount === 1 ? "like" : "likes"}
            </p>
          </div>

          {/* Bottom Add Comment Input */}
          <div className="border-t border-gray-100 bg-white shrink-0">
            {/* Replying Banner */}
            {replyingTo && (
              <div className="px-4 py-1.5 bg-neutral-50 flex items-center justify-between text-xs text-gray-500 border-b border-gray-100">
                <span>
                  Replying to <span className="font-semibold text-gray-800">@{replyingTo}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setText("");
                  }}
                  className="text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Input Row */}
            <div className="relative p-3 px-4 flex items-center gap-3">
              {/* Emoji Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEmojiPicker((prev) => !prev);
                  }}
                  className={`text-gray-700 hover:text-gray-900 cursor-pointer transition-colors p-0.5 rounded ${
                    showEmojiPicker ? "text-[#0095F6]" : ""
                  }`}
                  title="Add emoji"
                >
                  <Smile className="w-6 h-6" />
                </button>

                {/* Curated Emoji Picker */}
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-11 left-0 w-64 bg-white border border-gray-200 shadow-2xl rounded-xl p-2.5 z-50 animate-in fade-in zoom-in-95"
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

                    <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto pr-1">
                      {CURATED_EMOJIS.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => addEmojiHandler(emoji)}
                          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-neutral-100 rounded-lg cursor-pointer transition-transform active:scale-125 select-none"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Text Input */}
              <input
                ref={commentInputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessageHandler();
                }}
                placeholder="Add a comment..."
                className="flex-1 outline-none text-sm placeholder:text-gray-400 bg-transparent text-gray-900"
              />

              {/* Post Button */}
              <button
                type="button"
                disabled={!text.trim()}
                onClick={sendMessageHandler}
                className="text-[#0095F6] font-semibold text-sm hover:text-[#1877F2] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CommentDialog;
