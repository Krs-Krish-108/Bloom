import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constants";
import { setAuthUser } from "@/redux/authSlice";
import { toast } from "sonner";

// Instagram Verified Badge Icon
const VerifiedBadge = () => (
  <svg
    aria-label="Verified"
    className="w-3.5 h-3.5 inline-block text-[#0095F6] fill-[#0095F6] ml-1 shrink-0 align-middle"
    viewBox="0 0 24 24"
  >
    <path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.637-.89.07a2.89 2.89 0 0 0-2.656 2.657l-.07.89-.637.622a2.89 2.89 0 0 0 0 4.134l.637.622.07.89a2.89 2.89 0 0 0 2.656 2.657l.89.07.622.637a2.89 2.89 0 0 0 4.134 0l.622-.637.89-.07a2.89 2.89 0 0 0 2.656-2.657l.07-.89.637-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622-.07-.89a2.89 2.89 0 0 0-2.656-2.657l-.89-.07-.622-.637zm-.29 6.208-3.4 3.4a.75.75 0 0 1-1.06 0l-1.4-1.4a.75.75 0 1 1 1.06-1.06l.87.87 2.87-2.87a.75.75 0 1 1 1.06 1.06z" />
  </svg>
);

const NotificationDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, suggestedUsers } = useSelector((store) => store.auth);
  const { likeNotification } = useSelector((store) => store.realTimeNotification);
  const { posts } = useSelector((store) => store.post);

  const [activeFilter, setActiveFilter] = useState("All");
  const [followedMap, setFollowedMap] = useState({});

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Track follow status locally & sync with user.following
  const isFollowingUser = (targetId) => {
    if (followedMap[targetId] !== undefined) return followedMap[targetId];
    return (user?.following || []).some(
      (id) => (typeof id === "object" ? id?._id : id) === targetId
    );
  };

  const handleFollowToggle = async (targetUserId, e) => {
    e?.stopPropagation();
    if (!targetUserId) return;

    try {
      const res = await axios.post(
        `${USER_API_END_POINT}/followorunfollow/${targetUserId}`,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        const currentlyFollowing = isFollowingUser(targetUserId);
        const nextState = !currentlyFollowing;

        setFollowedMap((prev) => ({ ...prev, [targetUserId]: nextState }));

        let updatedFollowing = [...(user?.following || [])];
        if (nextState) {
          updatedFollowing.push(targetUserId);
        } else {
          updatedFollowing = updatedFollowing.filter(
            (id) => (typeof id === "object" ? id?._id : id) !== targetUserId
          );
        }
        dispatch(setAuthUser({ ...user, following: updatedFollowing }));
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  // Map incoming real-time notifications from Redux (like, comment, reply, follow, message)
  const liveNotifications = (likeNotification || []).map((notif, idx) => {
    const isReply =
      notif.type === "reply" ||
      (notif.commentText && notif.commentText.trim().startsWith("@"));
    const isLike = notif.type === "like";
    const isComment = notif.type === "comment";
    const isFollow = notif.type === "follow";
    const isMessage = notif.type === "message";

    let replyMention = "";
    let replyText = notif.commentText || notif.messageText || "";
    if (isReply && notif.commentText) {
      const match = notif.commentText.match(/^(@\S+)\s*(.*)$/);
      if (match) {
        replyMention = match[1];
        replyText = match[2];
      }
    }

    return {
      id: notif._id || `live-${idx}-${notif.userId}-${notif.postId || notif.createdAt || idx}`,
      type: notif.type || (isLike ? "like" : isComment ? "comment" : isMessage ? "message" : "like"),
      userId: notif.userId || notif.userDetails?._id,
      username: notif.userDetails?.username || "Someone",
      userAvatar: notif.userDetails?.profilePicture || "",
      isVerified: false,
      actionText: isReply
        ? "replied to your comment:"
        : isComment
        ? "commented on your post:"
        : isFollow
        ? "started following you."
        : isMessage
        ? "sent you a message:"
        : "liked your post.",
      replyMention,
      replyText: (isComment && !isReply) || isMessage ? (replyText ? `"${replyText}"` : "") : replyText,
      date: notif.createdAt
        ? new Date(notif.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "Just now",
      postThumbnail:
        notif.postMedia ||
        posts?.find((p) => p._id === notif.postId)?.media?.[0]?.url ||
        posts?.find((p) => p._id === notif.postId)?.image ||
        "",
      postId: notif.postId,
      isFromFollowedUser: isFollowingUser(notif.userId || notif.userDetails?._id),
    };
  });

  // Use only live real-time notifications
  const allNotifications = liveNotifications;

  // Apply Filter Pills: "All", "People you follow", "Comments", "Likes", "Messages"
  const filteredNotifications = allNotifications.filter((item) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "People you follow") {
      return item.isFromFollowedUser || isFollowingUser(item.userId);
    }
    if (activeFilter === "Comments") {
      return item.type === "comment" || item.type === "reply";
    }
    if (activeFilter === "Likes") {
      return item.type === "like";
    }
    if (activeFilter === "Messages") {
      return item.type === "message";
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Dimmed backdrop to close when clicked outside */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/25 backdrop-blur-[0.5px] transition-opacity duration-300"
      />

      {/* Slide-out Notifications Panel */}
      <aside
        className="fixed top-0 left-0 md:left-[72px] z-50 h-screen w-full sm:w-[397px] max-w-full md:max-w-[calc(100vw-72px)] bg-white border-r border-neutral-200 shadow-2xl flex flex-col transition-all duration-300 ease-out animate-in slide-in-from-left select-none"
      >
        {/* Top Header */}
        <div className="pt-6 px-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Notifications
            </h1>
            {/* Cross Button to close panel (No "Clear all") */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
              aria-label="Close notifications"
              title="Close"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { id: "All", label: "All" },
              { id: "People you follow", label: "People you follow" },
              { id: "Comments", label: "Comments" },
              { id: "Likes", label: "Likes" },
              { id: "Messages", label: "Messages" },
            ].map((pill) => {
              const isActive = activeFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setActiveFilter(pill.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 border border-neutral-200/50"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Header: Single "Recent" heading (No "This week" or "Earlier") */}
        <div className="px-6 pt-3 pb-1">
          <h2 className="text-sm font-bold text-neutral-900">Recent</h2>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3 divide-y divide-transparent">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              No notifications yet
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const followingStatus =
                item.initialFollowing && followedMap[item.userId] === undefined
                  ? true
                  : isFollowingUser(item.userId);

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  {/* Left: Avatar */}
                  <div
                    onClick={() => {
                      if (item.userId) {
                        navigate(`/profile/${item.userId}`);
                        onClose();
                      }
                    }}
                    className="relative shrink-0 cursor-pointer"
                  >
                    <Avatar className="w-11 h-11 border border-neutral-200">
                      <AvatarImage
                        src={item.userAvatar}
                        alt={item.username}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-xs font-bold bg-neutral-200 text-neutral-700">
                        {item.username?.slice(0, 2).toUpperCase() || "CN"}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Middle: Content */}
                  <div
                    onClick={() => {
                      if (item.type === "message") {
                        navigate("/chat");
                        onClose();
                      } else if (item.postId) {
                        navigate(`/?post=${item.postId}`);
                        onClose();
                      }
                    }}
                    className={`flex-1 text-[13px] leading-snug text-neutral-800 pr-1 ${
                      item.type === "message" || item.postId ? "cursor-pointer" : ""
                    }`}
                  >
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.userId) {
                          navigate(`/profile/${item.userId}`);
                          onClose();
                        }
                      }}
                      className="font-semibold text-neutral-900 cursor-pointer hover:underline inline-flex items-center"
                    >
                      {item.username}
                      {item.isVerified && <VerifiedBadge />}
                    </span>{" "}
                    {item.actionText}{" "}
                    {item.replyMention && (
                      <span className="text-[#0095F6] font-medium">
                        {item.replyMention}{" "}
                      </span>
                    )}
                    {item.replyText && (
                      <span className="text-neutral-900">{item.replyText} </span>
                    )}
                    <span className="text-neutral-400 text-xs whitespace-nowrap">
                      {item.date}
                    </span>
                  </div>

                  {/* Right Action: Post Thumbnail OR Follow/Following button OR Chat button */}
                  <div className="shrink-0 flex items-center justify-center">
                    {item.postThumbnail ? (
                      <img
                        src={item.postThumbnail}
                        alt="Post thumbnail"
                        onClick={() => {
                          if (item.postId) {
                            navigate(`/?post=${item.postId}`);
                            onClose();
                          }
                        }}
                        className="w-11 h-11 rounded-lg object-cover border border-neutral-200 cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    ) : item.type === "follow" || item.isSuggested ? (
                      <button
                        onClick={(e) => handleFollowToggle(item.userId, e)}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                          followingStatus
                            ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
                            : "bg-[#0095F6] hover:bg-[#1877F2] text-white shadow-sm"
                        }`}
                      >
                        {followingStatus ? "Following" : "Follow"}
                      </button>
                    ) : item.type === "message" ? (
                      <button
                        onClick={() => {
                          navigate("/chat");
                          onClose();
                        }}
                        className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-all cursor-pointer"
                      >
                        Chat
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};

export default NotificationDrawer;
