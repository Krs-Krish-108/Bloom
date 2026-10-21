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

  // 1-2 Suggested users strictly (as user specified: "1-2 par 1-2 se zyada mat daalna")
  const topSuggestedUsers = (suggestedUsers || []).slice(0, 1);

  // Baseline mock/seed notifications matching the user's exact uploaded Instagram layout
  const defaultNotifications = [
    {
      id: "mock-1",
      type: "reply",
      userId: "sagar_builds_id",
      username: "sagar_builds",
      userAvatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      actionText: "replied to your comment on sagar_builds's post:",
      replyMention: `@${user?.username || "krs_krish_108"}`,
      replyText: "Thanks! Kindly check your DMs.",
      date: "Aug 09",
      postThumbnail:
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&auto=format&fit=crop&q=80",
      isFromFollowedUser: true,
    },
    {
      id: "mock-2",
      type: "reply",
      userId: "sagar_builds_id",
      username: "sagar_builds",
      userAvatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      actionText: "replied to your comment on sagar_builds's post:",
      replyMention: `@${user?.username || "krs_krish_108"}`,
      replyText: "Sent you a message! Check it out!",
      date: "Aug 09",
      postThumbnail:
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&auto=format&fit=crop&q=80",
      isFromFollowedUser: true,
    },
    // Suggested user embedded in notification (as shown in reference screenshot)
    {
      id: "mock-suggested-1",
      type: "suggested",
      userId: topSuggestedUsers[0]?._id || "ars_hu636_id",
      username: topSuggestedUsers[0]?.username || "ars_hu636",
      userAvatar:
        topSuggestedUsers[0]?.profilePicture ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      actionText: ", who you might know, is on Bloom.",
      date: "Aug 03",
      isSuggested: true,
      isFromFollowedUser: false,
    },
    {
      id: "mock-4",
      type: "follow",
      userId: "rocks_yrr_id",
      username: "rocks_yrr",
      userAvatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      actionText: "started following you.",
      date: "Jun 23",
      isFromFollowedUser: true,
      initialFollowing: true,
    },
    {
      id: "mock-5",
      type: "like",
      userId: "alex_design_id",
      username: "alex_creator",
      userAvatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      actionText: "liked your post.",
      date: "Jun 18",
      postThumbnail:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
      isFromFollowedUser: false,
    },
  ];

  // Map incoming real-time notifications from Redux (like, comment, reply, follow)
  const liveNotifications = (likeNotification || []).map((notif, idx) => {
    const isReply =
      notif.type === "reply" ||
      (notif.commentText && notif.commentText.trim().startsWith("@"));
    const isLike = notif.type === "like";
    const isComment = notif.type === "comment";
    const isFollow = notif.type === "follow";

    let replyMention = "";
    let replyText = notif.commentText || "";
    if (isReply && notif.commentText) {
      const match = notif.commentText.match(/^(@\S+)\s*(.*)$/);
      if (match) {
        replyMention = match[1];
        replyText = match[2];
      }
    }

    return {
      id: `live-${idx}-${notif.userId}-${notif.postId || ""}`,
      type: notif.type || (isLike ? "like" : "comment"),
      userId: notif.userId,
      username: notif.userDetails?.username || "Someone",
      userAvatar: notif.userDetails?.profilePicture || "",
      isVerified: false,
      actionText: isReply
        ? "replied to your comment:"
        : isComment
        ? "commented on your post:"
        : isFollow
        ? "started following you."
        : "liked your post.",
      replyMention,
      replyText: isComment && !isReply ? `"${replyText}"` : replyText,
      date: "Just now",
      postThumbnail:
        notif.postMedia ||
        posts?.find((p) => p._id === notif.postId)?.media?.[0]?.url ||
        posts?.find((p) => p._id === notif.postId)?.image ||
        "",
      postId: notif.postId,
      isFromFollowedUser: isFollowingUser(notif.userId),
    };
  });

  // Combine live notifications at the top of Recent followed by default notifications
  const allNotifications = [...liveNotifications, ...defaultNotifications];

  // Apply Filter Pills: "All", "People you follow", "Comments", "Likes"
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
              No notifications found in {activeFilter.toLowerCase()}
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
                      if (item.userId) navigate(`/profile/${item.userId}`);
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
                  <div className="flex-1 text-[13px] leading-snug text-neutral-800 pr-1">
                    <span
                      onClick={() => {
                        if (item.userId) navigate(`/profile/${item.userId}`);
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

                  {/* Right Action: Post Thumbnail OR Follow/Following button */}
                  <div className="shrink-0 flex items-center justify-center">
                    {item.postThumbnail ? (
                      <img
                        src={item.postThumbnail}
                        alt="Post thumbnail"
                        onClick={() => {
                          if (item.postId) {
                            navigate(`/?post=${item.postId}`);
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
