import React, { useState, useRef, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { Plus, ImagePlus, X, Loader2, ChevronLeft, ChevronRight, Sparkles, ChevronDown, Music } from "lucide-react";
import axios from "axios";
import { StoryViewer } from "@/components/ui/story-viewer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STORY_API_END_POINT, POST_API_END_POINT } from "@/utils/constants";
import { toast } from "sonner";
import krsKrishAvatar from "@/assets/krskrish108.jpeg";
import MusicPickerModal from "./MusicPickerModal";

// Special Admin Story for Krs-Krish-108 (Visible ONLY to Admin)
const SPECIAL_ADMIN_STORY_USER = {
  userId: "special-krs-krish-108",
  username: "Krs-Krish-108",
  avatar: krsKrishAvatar || "/krskrish108.jpeg",
  timestamp: new Date().toISOString(),
  stories: [
    {
      id: "special-krs-krish-108-story-1",
      type: "image",
      isSpecialAdminStory: true,
      src: krsKrishAvatar || "/krskrish108.jpeg",
      originalSrc: krsKrishAvatar || "/krskrish108.jpeg",
      style: "",
      createdAt: new Date().toISOString(),
    },
  ],
};

const Stories = () => {
  const { user } = useSelector((store) => store.auth);
  const [myStories, setMyStories] = useState([]);
  const [otherStories, setOtherStories] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [originalPreview, setOriginalPreview] = useState(null);
  const [mediaType, setMediaType] = useState("image"); // "image" | "video"
  const [isUploading, setIsUploading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [styledUrl, setStyledUrl] = useState("");
  const [tempOriginalUrl, setTempOriginalUrl] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [isStyled, setIsStyled] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [openMusicModal, setOpenMusicModal] = useState(false);
  const fileInputRef = useRef(null);

  const isAdmin = Boolean(user?.isAdmin);

  // Filtered stories: Only real stories uploaded by users, with Krs-Krish-108 at the very end ONLY for Admin
  const displayedOtherStories = useMemo(() => {
    const rawStories = otherStories || [];
    const withoutSpecial = rawStories.filter((s) => s.username !== "Krs-Krish-108");

    if (isAdmin) {
      // For Admin, place Krs-Krish-108 at the very end of the queue (after all other users' stories)
      return [...withoutSpecial, SPECIAL_ADMIN_STORY_USER];
    }
    return withoutSpecial;
  }, [otherStories, isAdmin]);

  // Horizontal scroll navigation
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    }
  };

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Mouse drag-to-slide & horizontal wheel scroll
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const handleMouseDown = (e) => {
    if (e.button !== 0 || !scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeftState(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftState - walk;
    checkScroll();
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (!scrollContainerRef.current) return;
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  // Fetch all active stories from backend (Cloudinary & MongoDB)
  const fetchAllStories = async () => {
    try {
      const res = await axios.get(`${STORY_API_END_POINT}/all`, {
        withCredentials: true,
      });
      if (res.data.success) {
        const groups = res.data.groupedStories || [];
        const currentUserId = user?._id?.toString();

        const myGroup = groups.find((g) => g.userId === currentUserId);
        if (myGroup) {
          setMyStories(myGroup.stories);
        } else {
          setMyStories([]);
        }

        const others = groups.filter((g) => g.userId !== currentUserId);
        setOtherStories(others.length > 0 ? others : initialSeedStories);
      }
    } catch (err) {
      console.error("Failed to fetch stories from backend:", err);
      setOtherStories(initialSeedStories);
    }
  };

  useEffect(() => {
    fetchAllStories();
  }, [user?._id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkScroll();
    }, 100);
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScroll);
    };
  }, [otherStories, myStories]);

  const resetStoryModal = () => {
    setOpenAddModal(false);
    setSelectedFile(null);
    setPreviewMedia(null);
    setOriginalPreview(null);
    setSelectedStyle("");
    setStyledUrl("");
    setTempOriginalUrl("");
    setIsConverting(false);
    setIsStyled(false);
    setShowOriginal(false);
    setSelectedMusic(null);
    setOpenMusicModal(false);
    setIsUploading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error("File size must be under 25MB");
        return;
      }
      setSelectedFile(file);
      const isVideo =
        file.type.startsWith("video") ||
        file.name.endsWith(".mp4") ||
        file.name.endsWith(".mov") ||
        file.name.endsWith(".webm");
      setMediaType(isVideo ? "video" : "image");
      const url = URL.createObjectURL(file);
      setPreviewMedia(url);
      setOriginalPreview(url);
      setSelectedStyle("");
      setStyledUrl("");
      setTempOriginalUrl("");
      setIsStyled(isVideo ? true : false);
      setShowOriginal(false);
    }
  };

  const handleStyleConversion = async (chosenStyle) => {
    if (!selectedFile || mediaType === "video" || !chosenStyle) return;
    try {
      setIsConverting(true);
      setSelectedStyle(chosenStyle);

      const formData = new FormData();
      formData.append("style", chosenStyle);
      formData.append("file", selectedFile);

      const res = await axios.post(`${POST_API_END_POINT}/transform-style`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (res.data.success) {
        setStyledUrl(res.data.styledUrl);
        setTempOriginalUrl(res.data.tempOriginalUrl || "");
        setPreviewMedia(res.data.styledUrl);
        setIsStyled(true);
        const styleName =
          chosenStyle === "ghibli"
            ? "Studio Ghibli"
            : chosenStyle === "anime"
            ? "2D Anime"
            : chosenStyle === "pixar"
            ? "Disney Pixar 3D"
            : chosenStyle;
        toast.success(`✨ Story photo converted to ${styleName}!`);
      }
    } catch (err) {
      console.error("Story style transform error:", err);
      toast.error(err.response?.data?.message || "Failed to transform story style. Please retry.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleAddStory = async () => {
    if (!selectedFile) {
      toast.error("Please select an image or video");
      return;
    }

    if (mediaType === "image" && (!isStyled || !styledUrl)) {
      toast.error("Please select an AI style to convert your photo story before sharing");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", mediaType);
      formData.append("style", selectedStyle);
      formData.append("styledUrl", styledUrl);
      formData.append("originalUrl", tempOriginalUrl || originalPreview);
      if (selectedMusic) {
        formData.append("music", JSON.stringify(selectedMusic));
      }

      const res = await axios.post(`${STORY_API_END_POINT}/add`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success(res.data.message || "Story published!");
        resetStoryModal();
        fetchAllStories();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to upload story");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteStory = async (storyId) => {
    try {
      const res = await axios.delete(`${STORY_API_END_POINT}/delete/${storyId}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        toast.success("Story deleted");
        setMyStories((prev) => prev.filter((s) => s.id !== storyId));
        fetchAllStories();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to delete story");
    }
  };

  const myAvatar =
    user?.profilePicture ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80";
  const myUsername = user?.username || "Your story";

  return (
    <div className="relative w-full max-w-[620px] bg-transparent py-1 mb-2 select-none">
      {/* Left scroll chevron button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll("left")}
          className="hidden md:flex absolute -left-1 top-[44px] -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-md border border-neutral-200/90 items-center justify-center text-neutral-700 hover:text-neutral-950 hover:scale-110 transition-all cursor-pointer z-20"
          aria-label="Scroll stories left"
          title="Previous stories"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}

      {/* Stories list container - slider bar completely invisible */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className={`flex items-center gap-3 overflow-x-auto pb-1 select-none scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {/* FIRST ITEM: Current Logged-in User Story & Plus Button */}
        <div className="relative flex flex-col items-center gap-1.5 shrink-0">
          {myStories.length > 0 ? (
            <div className="relative">
              <StoryViewer
                stories={myStories}
                username="Your story"
                avatar={myAvatar}
                timestamp={new Date().toISOString()}
                isOwner={true}
                isAdmin={Boolean(user?.isAdmin)}
                onDeleteStory={handleDeleteStory}
              />
              {/* Plus button to add more stories to existing ones */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenAddModal(true);
                }}
                className="absolute bottom-6 right-0 w-5 h-5 rounded-full bg-[#0095F6] border-2 border-white flex items-center justify-center text-white shadow-sm hover:bg-[#1877F2] transition-colors"
                aria-label="Add story slide"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setOpenAddModal(true)}
              className="group flex flex-col items-center gap-1.5 cursor-pointer bg-transparent border-none outline-none"
              aria-label="Add your story"
            >
              <div className="relative w-[76px] h-[76px]">
                <div className="w-full h-full rounded-full overflow-hidden border border-neutral-200 bg-neutral-100 p-[2px]">
                  <img
                    src={myAvatar}
                    alt={myUsername}
                    className="w-full h-full rounded-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
                <div className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full bg-[#0095F6] border-2 border-white flex items-center justify-center text-white shadow-sm group-hover:bg-[#1877F2] transition-colors">
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
              <span className="text-xs text-neutral-600 truncate max-w-[78px] text-center font-normal">
                Your story
              </span>
            </button>
          )}
        </div>

        {/* OTHER USERS' STORIES */}
        {displayedOtherStories.map((storyUser) => (
          <StoryViewer
            key={storyUser.username || storyUser.userId}
            stories={storyUser.stories}
            username={storyUser.username}
            avatar={storyUser.avatar}
            timestamp={storyUser.timestamp}
            isOwner={false}
            isAdmin={isAdmin}
            onDeleteStory={handleDeleteStory}
          />
        ))}
      </div>

      {/* Right scroll chevron button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll("right")}
          className="hidden md:flex absolute -right-1 top-[44px] -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-md border border-neutral-200/90 items-center justify-center text-neutral-700 hover:text-neutral-950 hover:scale-110 transition-all cursor-pointer z-20"
          aria-label="Scroll stories right"
          title="Next stories"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}

      {/* ADD STORY DIALOG */}
      <Dialog
        open={openAddModal}
        onOpenChange={(isOpen) => {
          if (!isOpen) resetStoryModal();
          else setOpenAddModal(true);
        }}
      >
        <DialogContent className="sm:max-w-md p-6 bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-neutral-900 font-serif">
              Add to your Bloom Story
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 flex flex-col items-center">
            {previewMedia ? (
              <div className="relative w-full max-h-[380px] rounded-xl overflow-hidden bg-neutral-950 flex items-center justify-center border border-neutral-200">
                {mediaType === "video" ? (
                  <video
                    src={previewMedia}
                    className="max-h-[380px] w-auto object-contain"
                    controls
                    autoPlay
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={previewMedia}
                    alt="Story preview"
                    className="max-h-[380px] w-auto object-contain"
                  />
                )}

                {/* Conversion in-progress overlay */}
                {isConverting && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30 text-white p-4 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0095F6]" />
                    <p className="text-sm font-semibold">
                      Converting to {selectedStyle} art...
                    </p>
                    <p className="text-xs text-neutral-300">
                      Generating artistic style representation
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={resetStoryModal}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors z-40"
                  title="Remove media"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-56 rounded-xl border-2 border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100/70 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-neutral-700">
                  <ImagePlus className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-neutral-800">
                    Click to select photo or video
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Photos will require an AI art style conversion
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Photo: Mandatory AI Style Conversion Box */}
            {previewMedia && mediaType === "image" && (
              <div className="w-full mt-4 p-3.5 rounded-xl border border-purple-200/80 bg-purple-50/50 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-900">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Mandatory AI Style Conversion</span>
                  </div>
                  {isStyled && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ Style Applied
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-neutral-600 leading-tight">
                  Select an art style below. Your photo must be converted before sharing to story.
                </p>

                <div className="relative">
                  <select
                    value={selectedStyle}
                    disabled={isConverting}
                    onChange={(e) => {
                      const chosen = e.target.value;
                      if (chosen) {
                        handleStyleConversion(chosen);
                      }
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-purple-300 bg-white text-neutral-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled>
                      -- Choose Art Style (Mandatory) --
                    </option>
                    <option value="ghibli">Studio Ghibli (Hand-painted anime)</option>
                    <option value="anime">2D Japanese Anime (Makoto Shinkai)</option>
                    <option value="pixar">Disney Pixar 3D (3D CGI Animation)</option>
                  </select>
                </div>

                {isStyled && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-purple-700 font-medium text-[11px]">
                      Selected: <strong className="capitalize">{selectedStyle}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOriginal((prev) => {
                          const next = !prev;
                          setPreviewMedia(next ? originalPreview : styledUrl);
                          return next;
                        });
                      }}
                      className="text-[11px] text-purple-600 hover:text-purple-800 font-semibold underline cursor-pointer"
                    >
                      {showOriginal ? "View Converted Art" : "View Original Photo"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Video: Direct Upload Notice */}
            {previewMedia && mediaType === "video" && (
              <div className="w-full mt-3 p-3 rounded-xl border border-sky-200 bg-sky-50/60 flex items-center gap-2 text-xs text-sky-900">
                <span className="text-base">🔒</span>
                <span>
                  <strong>Video Story:</strong> Uploaded directly without style conversion. Visible only to you (Author-only privacy rule).
                </span>
              </div>
            )}

            {/* Add Music option to Story */}
            {previewMedia && (
              <div className="w-full mt-3 p-3 rounded-xl border border-neutral-200 bg-neutral-50/70 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 shrink-0">
                    <Music className="w-4 h-4" />
                  </div>
                  {selectedMusic ? (
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-neutral-900 truncate">
                        {selectedMusic.trackName}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {selectedMusic.artistName}
                      </p>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-neutral-800">
                        Add Music to Story
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Choose a 30s audio track
                      </p>
                    </div>
                  )}
                </div>

                {selectedMusic ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setOpenMusicModal(true)}
                      className="px-2 py-1 text-xs font-medium text-neutral-600 hover:text-black border border-neutral-300 rounded-md hover:bg-white transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMusic(null)}
                      className="p-1 text-neutral-400 hover:text-red-500 rounded-md cursor-pointer"
                      title="Remove song"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenMusicModal(true)}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-transform active:scale-95 shrink-0 cursor-pointer"
                  >
                    Select
                  </button>
                )}
              </div>
            )}

            <div className="mt-6 w-full flex gap-3">
              <button
                type="button"
                onClick={resetStoryModal}
                className="flex-1 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  !selectedFile ||
                  isUploading ||
                  isConverting ||
                  (mediaType === "image" && (!isStyled || !styledUrl))
                }
                onClick={handleAddStory}
                className="flex-1 py-2 rounded-lg bg-[#0095F6] hover:bg-[#1877F2] disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <span>Share Story</span>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Music Picker Dialog for Stories */}
      <MusicPickerModal
        open={openMusicModal}
        onClose={() => setOpenMusicModal(false)}
        onSelectTrack={(track) => setSelectedMusic(track)}
        selectedTrackId={selectedMusic?.id}
      />
    </div>
  );
};

export default Stories;
