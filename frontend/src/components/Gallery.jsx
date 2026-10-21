import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Heart, MessageCircle, Film, Sparkles, Bookmark, Share2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { setSelectedPost, setPosts } from "@/redux/postSlice";
import CommentDialog from "./CommentDialog";
import useGetAllPost from "@/hooks/useGetAllPost";
import axios from "axios";
import { POST_API_END_POINT } from "@/utils/constants";
import { toast } from "sonner";

// High-quality aesthetic fallback pins with variable heights to guarantee a true Pinterest masonry feel
const seedGalleryPins = [
  {
    _id: "seed-1",
    mediaUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
    mediaType: "image",
    aspectRatio: "aspect-[3/4]",
    caption: "Midnight aurora over the mountains #nature #celestial",
    author: {
      username: "aurora_explorer",
      profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    likes: ["1", "2", "3", "4", "5", "6"],
    comments: [{}, {}],
  },
  {
    _id: "seed-2",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    mediaType: "video",
    aspectRatio: "aspect-[9/16]",
    caption: "Cinematic trail run in Oregon #adventure #cinematic",
    author: {
      username: "matt_cooper",
      profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    likes: ["1", "2", "3"],
    comments: [{}],
  },
  {
    _id: "seed-3",
    mediaUrl: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&auto=format&fit=crop&q=80",
    mediaType: "image",
    aspectRatio: "aspect-square",
    caption: "Cozy morning sunshine and coffee moments #lifestyle",
    author: {
      username: "sofia_martinez",
      profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
    likes: ["1", "2", "3", "4"],
    comments: [{}, {}, {}],
  },
  {
    _id: "seed-4",
    mediaUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
    mediaType: "image",
    aspectRatio: "aspect-[2/3]",
    caption: "Yosemite valley mist rising at dawn #outdoors #wanderlust",
    author: {
      username: "richard_w",
      profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
    likes: ["1", "2", "3", "4", "5", "6", "7", "8"],
    comments: [{}, {}],
  },
  {
    _id: "seed-5",
    mediaUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80",
    mediaType: "image",
    aspectRatio: "aspect-[4/5]",
    caption: "Urban street aesthetics and neon reflections #cityvibes",
    author: {
      username: "tokyo_drifter",
      profilePicture: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&auto=format&fit=crop&q=80",
    },
    likes: ["1", "2", "3", "4", "5"],
    comments: [{}],
  },
  {
    _id: "seed-6",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    mediaType: "video",
    aspectRatio: "aspect-[4/5]",
    caption: "Scenic drive along the Pacific coast highway #ocean #travel",
    author: {
      username: "emma_obrien",
      profilePicture: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
    likes: ["1", "2", "3", "4", "5", "6"],
    comments: [{}, {}, {}, {}],
  },
  {
    _id: "seed-7",
    mediaUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80",
    mediaType: "image",
    aspectRatio: "aspect-[3/4]",
    caption: "Dense emerald forest covered in morning fog #solitude",
    author: {
      username: "woodland_wander",
      profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    likes: ["1", "2", "3"],
    comments: [],
  },
  {
    _id: "seed-8",
    mediaUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80",
    mediaType: "image",
    aspectRatio: "aspect-square",
    caption: "Modern minimalist architectural villa design #interior #design",
    author: {
      username: "arch_digest",
      profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
    likes: ["1", "2", "3", "4", "5", "6", "7"],
    comments: [{}],
  },
  {
    _id: "seed-9",
    mediaUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
    mediaType: "image",
    aspectRatio: "aspect-[2/3]",
    caption: "Tropical turquoise waters and white sand beach #summer #paradise",
    author: {
      username: "beach_days",
      profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
    likes: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    comments: [{}, {}],
  },
];

const aspectRatios = [
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-[2/3]",
  "aspect-square",
  "aspect-[9/16]",
];

const Gallery = () => {
  useGetAllPost();
  const dispatch = useDispatch();
  const { posts } = useSelector((store) => store.post);
  const { user } = useSelector((store) => store.auth);
  const isAdmin = Boolean(user?.isAdmin);
  const [filter, setFilter] = useState("all"); // 'all' | 'image' | 'video'
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [savedPins, setSavedPins] = useState(new Set());

  // Convert real user posts + carousel items into Pinterest-style Pins
  const allPins = useMemo(() => {
    const extractedPins = [];

    (posts || []).forEach((post, postIdx) => {
      if (post.media && post.media.length > 0) {
        post.media.forEach((mItem, mIdx) => {
          // Standard converted pin
          extractedPins.push({
            _id: `${post._id}-m-${mIdx}`,
            originalPost: post,
            mediaIndex: mIdx,
            mediaUrl: mItem.url,
            mediaType: mItem.mediaType || "image",
            isOriginalPhoto: false,
            aspectRatio: aspectRatios[(postIdx + mIdx) % aspectRatios.length],
            caption: post.caption,
            author: post.author,
            likes: post.likes || [],
            comments: post.comments || [],
            createdAt: post.createdAt,
          });

          // For Admin: Also display original unedited photo as a pin!
          if (isAdmin && mItem.originalUrl) {
            extractedPins.push({
              _id: `${post._id}-m-${mIdx}-orig`,
              originalPost: post,
              mediaIndex: mIdx,
              mediaUrl: mItem.originalUrl,
              mediaType: "image",
              isOriginalPhoto: true,
              aspectRatio: aspectRatios[(postIdx + mIdx + 2) % aspectRatios.length],
              caption: post.caption,
              author: post.author,
              likes: post.likes || [],
              comments: post.comments || [],
              createdAt: post.createdAt,
            });
          }
        });
      } else if (post.image) {
        const isVideo =
          post.image.endsWith(".mp4") ||
          post.image.endsWith(".webm") ||
          post.image.includes("/video/");
        extractedPins.push({
          _id: post._id,
          originalPost: post,
          mediaIndex: 0,
          mediaUrl: post.image,
          mediaType: isVideo ? "video" : "image",
          isOriginalPhoto: false,
          aspectRatio: aspectRatios[postIdx % aspectRatios.length],
          caption: post.caption,
          author: post.author,
          likes: post.likes || [],
          comments: post.comments || [],
          createdAt: post.createdAt,
        });

        if (isAdmin && post.originalImage) {
          extractedPins.push({
            _id: `${post._id}-orig`,
            originalPost: post,
            mediaIndex: 0,
            mediaUrl: post.originalImage,
            mediaType: "image",
            isOriginalPhoto: true,
            aspectRatio: aspectRatios[(postIdx + 2) % aspectRatios.length],
            caption: post.caption,
            author: post.author,
            likes: post.likes || [],
            comments: post.comments || [],
            createdAt: post.createdAt,
          });
        }
      }
    });

    // Merge real pins first, then append seed pins to provide a rich Pinterest masonry experience
    return [...extractedPins, ...seedGalleryPins];
  }, [posts, isAdmin]);

  // Filter items
  const filteredPins = useMemo(() => {
    if (filter === "all") return allPins;
    return allPins.filter((pin) => pin.mediaType === filter);
  }, [allPins, filter]);

  const handlePinClick = (pin) => {
    if (!pin) return;
    if (pin.originalPost) {
      const feedMatch = (posts || []).find(
        (p) => (p._id || p.id)?.toString() === (pin.originalPost._id || pin.originalPost.id)?.toString()
      );
      const basePost = feedMatch || pin.originalPost;
      dispatch(
        setSelectedPost({
          ...basePost,
          initialSlide: pin.mediaIndex ?? 0,
          showOriginalByDefault: Boolean(pin.isOriginalPhoto),
        })
      );
      setOpenCommentDialog(true);
    } else {
      // For seed pins, generate standard post shape for CommentDialog
      dispatch(
        setSelectedPost({
          _id: pin._id,
          image: pin.mediaUrl,
          mediaUrl: pin.mediaUrl,
          mediaType: pin.mediaType,
          media: [
            {
              url: pin.mediaUrl,
              mediaType: pin.mediaType || "image",
            },
          ],
          caption: pin.caption,
          author: pin.author,
          likes: pin.likes || [],
          comments:
            pin.comments && pin.comments.length > 0
              ? pin.comments
              : [
                  {
                    _id: "c1",
                    text: "Amazing visual! Love this aesthetic ✨",
                    author: {
                      username: "yuki_tanaka",
                      profilePicture:
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                    },
                  },
                ],
        })
      );
      setOpenCommentDialog(true);
    }
  };

  const handleSavePin = (e, pinId) => {
    e.stopPropagation();
    setSavedPins((prev) => {
      const next = new Set(prev);
      if (next.has(pinId)) {
        next.delete(pinId);
        toast.info("Removed from saved pins");
      } else {
        next.add(pinId);
        toast.success("Saved to your Pinterest board!");
      }
      return next;
    });
  };

  const handleDeletePin = async (e, postId) => {
    e.stopPropagation();
    const confirmDelete = window.confirm("Are you sure you want to delete this post? (Admin Action)");
    if (!confirmDelete) return;

    try {
      const res = await axios.delete(`${POST_API_END_POINT}/delete/${postId}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        toast.success("Post deleted by Admin");
        dispatch(setPosts((posts || []).filter((p) => p._id !== postId)));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete post");
    }
  };

  return (
    <div className="w-full min-h-screen bg-neutral-50/50 pb-20">
      {/* Gallery Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-600" />
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900 font-sans">
                Gallery & Inspiration
              </h1>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Explore visual ideas, photography, and videos shared by the community
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: "All Pins" },
              { id: "image", label: "Photos" },
              { id: "video", label: "Videos" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === tab.id
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pinterest-Style Masonry Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 [column-fill:_balance]">
          {filteredPins.map((pin) => {
            const isSaved = savedPins.has(pin._id);

            return (
              <div
                key={pin._id}
                onClick={() => handlePinClick(pin)}
                className="break-inside-avoid mb-4 group relative rounded-2xl overflow-hidden bg-neutral-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer select-none"
              >
                {/* Media Item */}
                <div className={`w-full ${pin.aspectRatio || "aspect-auto"} overflow-hidden bg-neutral-900`}>
                  {pin.mediaType === "video" ? (
                    <video
                      src={pin.mediaUrl}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      muted
                      loop
                      playsInline
                      onMouseEnter={(e) => {
                        e.currentTarget.play().catch(() => {});
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    />
                  ) : (
                    <img
                      src={pin.mediaUrl}
                      alt={pin.caption || "Pin"}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>

                {/* Video Badge (Top Left) */}
                {pin.mediaType === "video" && (
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 z-10">
                    <Film className="w-3 h-3 text-sky-400" />
                    <span>Video</span>
                  </div>
                )}

                {/* Admin Original Badge (Top Left) */}
                {pin.isOriginalPhoto && (
                  <div className="absolute top-3 left-3 bg-purple-700/85 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 z-10 shadow">
                    <span>📷</span>
                    <span>Original Photo</span>
                  </div>
                )}

                {/* Hover Overlay with Pinterest-style Save Button & Author Details */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3.5 z-10">
                  {/* Top: Admin Delete Button & Save Button */}
                  <div className="flex items-center justify-between">
                    {isAdmin && pin.originalPost?._id ? (
                      <button
                        type="button"
                        onClick={(e) => handleDeletePin(e, pin.originalPost._id)}
                        className="p-1.5 rounded-full bg-red-600/90 hover:bg-red-700 text-white transition-all shadow-md cursor-pointer hover:scale-105"
                        title="Delete Post (Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div />
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleSavePin(e, pin._id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                        isSaved
                          ? "bg-black text-white"
                          : "bg-[#E60023] hover:bg-[#ad081b] text-white active:scale-95"
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-white" : ""}`} />
                      <span>{isSaved ? "Saved" : "Save"}</span>
                    </button>
                  </div>

                  {/* Bottom: Author info, Caption & Likes */}
                  <div className="space-y-1.5">
                    {pin.caption && (
                      <p className="text-white text-xs font-medium line-clamp-2 leading-tight drop-shadow-sm">
                        {pin.caption}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="w-6 h-6 border border-white/40 shrink-0">
                          <AvatarImage src={pin.author?.profilePicture} />
                          <AvatarFallback className="text-[9px] font-bold">
                            {pin.author?.username?.slice(0, 2).toUpperCase() || "CN"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white text-xs font-medium truncate drop-shadow-sm">
                          {pin.author?.username || "creator"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-white/90 text-xs shrink-0">
                        <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                        <span>{pin.likes?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post Details / Comment Dialog Modal */}
      <CommentDialog open={openCommentDialog} setOpen={setOpenCommentDialog} />
    </div>
  );
};

export default Gallery;
