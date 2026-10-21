import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  ArrowLeft,
  X,
  Maximize2,
  ZoomIn,
  Copy,
  Plus,
  Smile,
  Loader2,
  Image as ImageIcon,
  Square,
  RectangleVertical,
  RectangleHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Film,
  Sparkles,
  Music,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { POST_API_END_POINT } from "@/utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "@/redux/postSlice";
import MusicPickerModal from "./MusicPickerModal";

const MAX_MEDIA_COUNT = 10;

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

const CreatePost = ({ open, setOpen }) => {
  const fileInputRef = useRef(null);
  const additionalFileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Steps: 'upload' | 'crop' | 'caption'
  const [step, setStep] = useState("upload");

  // Media state
  const [mediaItems, setMediaItems] = useState([]); // array of { file, preview, type: 'image' | 'video', name }
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // Aspect ratio crop options: 'original' | '1:1' | '4:5' | '16:9'
  const [cropRatio, setCropRatio] = useState("1:1");
  const [showCropMenu, setShowCropMenu] = useState(false);
  const [showMediaTray, setShowMediaTray] = useState(false);

  // Caption & Tag states
  const [caption, setCaption] = useState("");
  const [isBirthdayTag, setIsBirthdayTag] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [openMusicModal, setOpenMusicModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Discard Confirmation dialog state
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const { user } = useSelector((store) => store.auth);
  const { posts } = useSelector((store) => store.post);
  const dispatch = useDispatch();

  // Reset state helper
  const resetState = () => {
    setCaption("");
    setMediaItems([]);
    setCurrentPreviewIndex(0);
    setCropRatio("1:1");
    setShowCropMenu(false);
    setShowMediaTray(false);
    setIsBirthdayTag(false);
    setSelectedStyle("");
    setShowEmojiPicker(false);
    setShowOriginal(false);
    setSelectedMusic(null);
    setOpenMusicModal(false);
    setLoading(false);
    setStep("upload");
    setShowDiscardConfirm(false);
  };

  const handleClose = () => {
    if (mediaItems.length > 0) {
      setShowDiscardConfirm(true);
    } else {
      resetState();
      setOpen(false);
    }
  };

  const confirmDiscard = () => {
    resetState();
    setOpen(false);
  };

  // Close on Escape key & close emoji picker on outside click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        handleClose();
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
  }, [open, mediaItems.length]);

  // Process selected files
  const processFiles = (files) => {
    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) return;

    const remainingSlots = MAX_MEDIA_COUNT - mediaItems.length;

    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_MEDIA_COUNT} photos and videos allowed in a single post`);
      return;
    }

    if (selectedFiles.length > remainingSlots) {
      toast.warning(`Only ${remainingSlots} more items can be added (Maximum ${MAX_MEDIA_COUNT})`);
    }

    const filesToProcess = selectedFiles.slice(0, remainingSlots);
    const newItems = [];
    let completedCount = 0;

    filesToProcess.forEach((file) => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`"${file.name}" is over 50MB. Please select smaller media.`);
        completedCount++;
        return;
      }

      const isVideo =
        file.type.startsWith("video") ||
        file.name.endsWith(".mp4") ||
        file.name.endsWith(".webm") ||
        file.name.endsWith(".mov");

      const reader = new FileReader();
      reader.onloadend = () => {
        newItems.push({
          file,
          preview: reader.result,
          originalPreview: reader.result,
          type: isVideo ? "video" : "image",
          name: file.name,
          isStyled: isVideo ? true : false,
          style: "",
          styledUrl: "",
          originalUrl: "",
          publicId: "",
          isConverting: false
        });

        completedCount++;
        if (completedCount === filesToProcess.length) {
          setMediaItems((prev) => [...prev, ...newItems]);
          if (step === "upload") {
            setStep("crop");
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const fileChangeHandler = (e) => {
    processFiles(e.target.files);
    e.target.value = "";
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeItemHandler = (indexToRemove, e) => {
    if (e) e.stopPropagation();
    setMediaItems((prev) => {
      const updated = prev.filter((_, i) => i !== indexToRemove);
      if (updated.length === 0) {
        resetState();
      } else if (currentPreviewIndex >= updated.length) {
        setCurrentPreviewIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const nextSlide = (e) => {
    if (e) e.stopPropagation();
    if (currentPreviewIndex < mediaItems.length - 1) {
      setCurrentPreviewIndex((prev) => prev + 1);
    }
  };

  const prevSlide = (e) => {
    if (e) e.stopPropagation();
    if (currentPreviewIndex > 0) {
      setCurrentPreviewIndex((prev) => prev - 1);
    }
  };

  // Add emoji to caption
  const addEmojiHandler = (emoji) => {
    setCaption((prev) => prev + emoji);
  };

  // Helper to format style display names
  const getStyleDisplayName = (styleKey) => {
    switch ((styleKey || "").toLowerCase()) {
      case "ghibli":
        return "Studio Ghibli";
      case "anime":
        return "2D Anime";
      case "pixar":
        return "Disney Pixar 3D";
      default:
        return styleKey || "AI Style";
    }
  };

  // Handle transforming an image to a chosen artistic style
  const transformItemStyleHandler = async (index, styleToApply) => {
    const item = mediaItems[index];
    if (!item || item.type === "video" || !styleToApply) return;

    try {
      setMediaItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], isConverting: true, pendingStyle: styleToApply };
        return updated;
      });

      const formData = new FormData();
      formData.append("style", styleToApply);

      if (item.tempOriginalUrl && item.tempPublicId) {
        formData.append("existingOriginalUrl", item.tempOriginalUrl);
        formData.append("existingPublicId", item.tempPublicId);
      } else if (item.file) {
        formData.append("file", item.file);
      }

      const res = await axios.post(`${POST_API_END_POINT}/transform-style`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (res.data.success) {
        setMediaItems((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            preview: res.data.styledUrl,
            styledUrl: res.data.styledUrl,
            originalUrl: res.data.originalUrl || res.data.tempOriginalUrl || updated[index].originalUrl || updated[index].tempOriginalUrl || "",
            tempOriginalUrl: res.data.tempOriginalUrl || res.data.originalUrl || updated[index].tempOriginalUrl || "",
            tempPublicId: res.data.tempPublicId || updated[index].tempPublicId,
            style: res.data.style,
            isStyled: true,
            isConverting: false,
            pendingStyle: "",
          };
          return updated;
        });
        toast.success(`✨ Photo ${index + 1} converted to ${getStyleDisplayName(res.data.style)}!`);
      }
    } catch (err) {
      console.error("Style transform error:", err);
      toast.error(
        err.response?.data?.message || "Failed to transform photo style. Please try again."
      );
      setMediaItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], isConverting: false, pendingStyle: "" };
        return updated;
      });
    }
  };

  // Check style conversion status for validation
  const imageItems = mediaItems.filter((m) => m.type === "image");
  const totalImageCount = imageItems.length;
  const styledImagesCount = imageItems.filter((m) => m.isStyled && Boolean(m.styledUrl)).length;
  const allImagesStyled = totalImageCount > 0 && styledImagesCount === totalImageCount;
  const isAnyConverting = mediaItems.some((m) => m.isConverting);
  const isFormValid = Boolean(
    mediaItems.length > 0 && allImagesStyled && !isAnyConverting && !loading
  );

  // Submit Post to Backend
  const createPostHandler = async () => {
    if (!isFormValid) {
      if (totalImageCount > styledImagesCount) {
        toast.error(`Please convert all ${totalImageCount} photos before sharing.`);
      }
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("isBirthdayTag", isBirthdayTag);
      formData.append("cropRatio", cropRatio);

      const stylesList = [...new Set(mediaItems.map((m) => m.style).filter(Boolean))];
      formData.append("style", stylesList.join(", ") || "AI Stylized");

      // Converted images are sent as primary url, and unedited originals are saved as originalUrl for Admin
      const mediaDetails = mediaItems.map((item) => ({
        url: item.styledUrl || (item.type === "video" ? "" : item.preview),
        originalUrl: item.originalUrl || item.tempOriginalUrl || "",
        style: item.style || "",
        mediaType: item.type,
        publicId: item.publicId || "",
      }));

      formData.append("mediaDetails", JSON.stringify(mediaDetails));

      if (selectedMusic && selectedMusic.previewUrl) {
        formData.append("music", JSON.stringify({
          trackName: selectedMusic.trackName || "",
          artistName: selectedMusic.artistName || "",
          previewUrl: selectedMusic.previewUrl || "",
          artworkUrl: selectedMusic.artworkUrl || ""
        }));
      }

      // Append video files so backend can upload them
      mediaItems.forEach((item) => {
        if (item.type === "video" && item.file) {
          formData.append("media", item.file);
        }
      });

      const res = await axios.post(`${POST_API_END_POINT}/addpost`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      if (res.data.success) {
        dispatch(setPosts([res.data.post, ...(posts || [])]));
        toast.success(res.data.message || "Post shared successfully!");
        resetState();
        setOpen(false);
      }
    } catch (error) {
      console.error("Create post error:", error);
      toast.error(error.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const currentItem = mediaItems[currentPreviewIndex];

  // Helper function to render media based on selected crop ratio
  const renderCroppedMedia = (item, isVideoAutoplay = true) => {
    if (!item) return null;

    const displaySrc = showOriginal && item.originalPreview ? item.originalPreview : item.preview;

    let containerStyle = "w-full h-full flex items-center justify-center";
    let mediaStyle = "w-full h-full object-cover";

    if (cropRatio === "original") {
      containerStyle = "w-full h-full flex items-center justify-center";
      mediaStyle = "w-full h-full object-contain relative z-10";
    } else if (cropRatio === "1:1") {
      containerStyle = "w-full h-full flex items-center justify-center";
      mediaStyle = "w-full h-full object-cover relative z-10";
    } else if (cropRatio === "4:5") {
      containerStyle = "h-full aspect-[4/5] mx-auto flex items-center justify-center overflow-hidden shadow-2xl relative z-10";
      mediaStyle = "w-full h-full object-cover";
    } else if (cropRatio === "16:9") {
      containerStyle = "w-full aspect-[16/9] my-auto flex items-center justify-center overflow-hidden shadow-2xl relative z-10";
      mediaStyle = "w-full h-full object-cover";
    }

    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
        {/* Ambient Blur Background Reflection (YouTube / Instagram style) */}
        {item.type === "video" ? (
          <video
            src={displaySrc}
            className="absolute inset-0 w-full h-full object-cover filter blur-2xl scale-125 opacity-70 pointer-events-none brightness-75"
            muted
            loop
            autoPlay
            playsInline
          />
        ) : (
          <img
            src={displaySrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover filter blur-2xl scale-125 opacity-70 pointer-events-none brightness-75"
          />
        )}

        {/* Foreground Content */}
        <div className={containerStyle}>
          {item.type === "video" ? (
            <video
              src={displaySrc}
              className={mediaStyle}
              autoPlay={isVideoAutoplay}
              muted
              loop
              playsInline
              controls
            />
          ) : (
            <img src={displaySrc} alt="preview" className={mediaStyle} />
          )}
        </div>

        {/* Converting Loading Shimmer Overlay */}
        {item.isConverting && (
          <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-white px-6 text-center animate-in fade-in duration-200">
            <div className="relative">
              <Loader2 className="w-10 h-10 animate-spin text-[#0095F6]" />
              <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-sm tracking-wide">
                Applying AI Artistic Transformation...
              </span>
              <span className="text-xs text-white/70">
                Converting image to {item.pendingStyle || "selected style"}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Outside Top-Right Close Button (Standard Instagram style - Desktop only) */}
      <button
        onClick={handleClose}
        className="hidden md:block fixed top-5 right-5 text-white/90 hover:text-white p-2 z-50 transition-colors"
        aria-label="Close"
      >
        <X className="w-7 h-7" />
      </button>

      {/* Main Modal Box */}
      <div
        className={`relative z-50 bg-white rounded-none md:rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col transition-all duration-300 w-full h-full md:h-auto max-h-[100dvh] md:max-h-[95vh] ${
          step === "caption" ? "md:w-[920px]" : "md:w-[580px]"
        }`}
        onClick={() => {
          if (showCropMenu) setShowCropMenu(false);
        }}
      >
        {/* ================= STEP 1: INITIAL UPLOAD / DRAG & DROP ================= */}
        {step === "upload" && (
          <>
            <div className="h-11 px-4 border-b border-gray-100 flex items-center justify-between md:justify-center select-none bg-white">
              <button
                type="button"
                onClick={handleClose}
                className="md:hidden text-gray-700 hover:text-black p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <h1 className="font-semibold text-base text-gray-900">Create new post</h1>
              <div className="w-5 md:hidden" />
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full h-[calc(100vh-44px)] md:h-[580px] flex flex-col items-center justify-center p-8 transition-colors ${
                isDragging ? "bg-sky-50/50" : "bg-white"
              }`}
            >
              {/* Instagram's authentic media icon (Photo overlapping video) */}
              <div className="mb-4 text-neutral-800">
                <svg
                  aria-label="Media upload icon"
                  className="w-24 h-24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  viewBox="0 0 97.6 77.3"
                >
                  <rect
                    x="2"
                    y="14"
                    width="62"
                    height="58"
                    rx="6"
                    className="stroke-neutral-800"
                  />
                  <circle cx="18" cy="30" r="4.5" className="stroke-neutral-800" />
                  <path
                    d="M3 56l16-16a3 3 0 0 1 4.2 0l14.8 14.8a3 3 0 0 0 4.2 0l7.8-7.8a3 3 0 0 1 4.2 0L63 56"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-neutral-800"
                  />
                  <rect
                    x="33"
                    y="5"
                    width="62"
                    height="58"
                    rx="6"
                    fill="white"
                    className="stroke-neutral-800"
                  />
                  <polygon
                    points="59,25 59,43 73,34"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </div>

              <h2 className="text-xl font-normal text-neutral-900 mb-5 text-center">
                Drag photos and videos here
              </h2>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={fileChangeHandler}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#0095F6] hover:bg-[#1877F2] text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors shadow-sm active:scale-95 cursor-pointer"
              >
                Select from computer
              </button>
            </div>
          </>
        )}

        {/* ================= STEP 2: CROP SCREEN ================= */}
        {step === "crop" && (
          <>
            {/* Header */}
            <div className="h-11 px-4 border-b border-gray-100 flex items-center justify-between select-none bg-white">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(true)}
                className="text-gray-900 hover:opacity-70 transition-opacity cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              <h1 className="font-semibold text-base text-gray-900">Crop</h1>

              <button
                type="button"
                onClick={() => setStep("caption")}
                className="text-[#0095F6] hover:text-[#1877F2] font-semibold text-sm transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>

            {/* Media Canvas (Responsive height on mobile, 580px on desktop) */}
            <div className="relative w-full h-[calc(100vh-44px)] md:h-[580px] bg-white flex items-center justify-center overflow-hidden select-none">
              {/* Media rendering with aspect ratio */}
              {renderCroppedMedia(currentItem)}

              {/* Carousel Navigation Arrows */}
              {mediaItems.length > 1 && (
                <>
                  {currentPreviewIndex > 0 && (
                    <button
                      type="button"
                      onClick={prevSlide}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all z-20 shadow-md cursor-pointer"
                      aria-label="Previous"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}

                  {currentPreviewIndex < mediaItems.length - 1 && (
                    <button
                      type="button"
                      onClick={nextSlide}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all z-20 shadow-md cursor-pointer"
                      aria-label="Next"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}

                  {/* Pagination Dots */}
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-none">
                    {mediaItems.map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          currentPreviewIndex === idx
                            ? "bg-white scale-125 shadow"
                            : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Bottom Left Floating Buttons: Crop Selector & Zoom */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2.5 z-30">
                {/* Crop Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCropMenu((prev) => !prev);
                    }}
                    className={`w-8 h-8 rounded-full text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer ${
                      showCropMenu ? "bg-white text-black" : "bg-black/70 hover:bg-black/90"
                    }`}
                    title="Select crop"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  {/* Crop Popover Menu (Matches Screenshot 3 & 4) */}
                  {showCropMenu && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-11 left-0 w-32 bg-[#262626]/95 backdrop-blur-md text-white rounded-xl py-1 shadow-2xl border border-white/10 z-40 divide-y divide-white/10 overflow-hidden"
                    >
                      {/* Original */}
                      <button
                        type="button"
                        onClick={() => {
                          setCropRatio("original");
                          setShowCropMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors cursor-pointer ${
                          cropRatio === "original"
                            ? "text-white font-semibold bg-white/15"
                            : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span>Original</span>
                        <ImageIcon className="w-4 h-4" />
                      </button>

                      {/* 1:1 */}
                      <button
                        type="button"
                        onClick={() => {
                          setCropRatio("1:1");
                          setShowCropMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors cursor-pointer ${
                          cropRatio === "1:1"
                            ? "text-white font-semibold bg-white/15"
                            : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span>1:1</span>
                        <Square className="w-4 h-4" />
                      </button>

                      {/* 4:5 */}
                      <button
                        type="button"
                        onClick={() => {
                          setCropRatio("4:5");
                          setShowCropMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors cursor-pointer ${
                          cropRatio === "4:5"
                            ? "text-white font-semibold bg-white/15"
                            : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span>4:5</span>
                        <RectangleVertical className="w-4 h-4" />
                      </button>

                      {/* 16:9 */}
                      <button
                        type="button"
                        onClick={() => {
                          setCropRatio("16:9");
                          setShowCropMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors cursor-pointer ${
                          cropRatio === "16:9"
                            ? "text-white font-semibold bg-white/15"
                            : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span>16:9</span>
                        <RectangleHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Zoom Icon Button (Visual like Instagram) */}
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
                  title="Zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Right Floating Button: Multi-media tray toggle */}
              <div className="absolute bottom-4 right-4 z-30">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMediaTray((prev) => !prev);
                  }}
                  className={`w-8 h-8 rounded-full text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer ${
                    showMediaTray ? "bg-white text-black" : "bg-black/70 hover:bg-black/90"
                  }`}
                  title="Open carousel tray"
                >
                  <Copy className="w-4 h-4" />
                </button>

                {/* Multi-Media Thumbnail Drawer */}
                {showMediaTray && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-11 right-0 bg-[#262626]/95 backdrop-blur-md p-2 rounded-xl border border-white/10 flex items-center gap-2 z-40 shadow-2xl max-w-[360px] overflow-x-auto"
                  >
                    {mediaItems.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => setCurrentPreviewIndex(idx)}
                        className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 cursor-pointer border-2 transition-all ${
                          currentPreviewIndex === idx
                            ? "border-[#0095F6] scale-105"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        {item.type === "video" ? (
                          <video src={item.preview} className="w-full h-full object-cover" />
                        ) : (
                          <img src={item.preview} alt="" className="w-full h-full object-cover" />
                        )}

                        {item.type === "video" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                            <Film className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}

                        {/* Remove item button */}
                        <button
                          type="button"
                          onClick={(e) => removeItemHandler(idx, e)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}

                    {/* Add More Media Button */}
                    {mediaItems.length < MAX_MEDIA_COUNT && (
                      <>
                        <input
                          ref={additionalFileInputRef}
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={fileChangeHandler}
                        />
                        <button
                          type="button"
                          onClick={() => additionalFileInputRef.current?.click()}
                          className="w-12 h-12 rounded-lg border-2 border-dashed border-neutral-400 flex items-center justify-center text-neutral-300 hover:border-white hover:text-white transition-colors shrink-0 cursor-pointer"
                          title={`Add more (${mediaItems.length}/${MAX_MEDIA_COUNT})`}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ================= STEP 3: CAPTION, HAPPY BIRTHDAY TAG & STYLE (Matches Screenshot 5) ================= */}
        {step === "caption" && (
          <>
            {/* Header */}
            <div className="h-11 px-4 border-b border-gray-100 flex items-center justify-between select-none bg-white">
              <button
                type="button"
                onClick={() => setStep("crop")}
                className="text-gray-900 hover:opacity-70 transition-opacity cursor-pointer"
                aria-label="Back to crop"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              <h1 className="font-semibold text-base text-gray-900">Create new post</h1>

              {loading ? (
                <div className="flex items-center gap-1.5 text-[#0095F6] font-semibold text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sharing...</span>
                </div>
              ) : isFormValid ? (
                <button
                  type="button"
                  onClick={createPostHandler}
                  className="text-[#0095F6] hover:text-[#1877F2] font-semibold text-sm transition-colors cursor-pointer"
                >
                  Share
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="text-gray-300 font-semibold text-sm cursor-not-allowed select-none transition-colors"
                  title={
                    isAnyConverting
                      ? "Converting photo styles... Please wait"
                      : totalImageCount > styledImagesCount
                      ? `Please convert all ${totalImageCount - styledImagesCount} remaining photo(s) to unlock Share`
                      : "Please add media to share"
                  }
                >
                  Share
                </button>
              )}
            </div>

            {/* Split Content: Media preview on Top/Left, Sidebar on Bottom/Right */}
            <div className="flex flex-col md:flex-row w-full h-[calc(100vh-44px)] md:h-[580px] bg-white overflow-y-auto md:overflow-hidden">
              {/* Left Column: Media Preview */}
              <div className="relative w-full aspect-square md:w-[580px] md:h-[580px] bg-white flex items-center justify-center overflow-hidden select-none border-b md:border-b-0 md:border-r border-gray-100 shrink-0">
                {renderCroppedMedia(currentItem, false)}

                {/* Happy Birthday Tag Badge on Bottom Left (When toggle is ON) */}
                {isBirthdayTag && (
                  <div className="absolute bottom-4 left-4 bg-black/65 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 font-medium z-20 pointer-events-none border border-white/10 animate-in fade-in zoom-in-95 duration-200">
                    <span>🎉</span>
                    <span className="tracking-wide">Happy Birthday! 🎂</span>
                  </div>
                )}

                {/* Carousel navigation in caption step */}
                {mediaItems.length > 1 && (
                  <>
                    {currentPreviewIndex > 0 && (
                      <button
                        type="button"
                        onClick={prevSlide}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all z-20 shadow-md cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}

                    {currentPreviewIndex < mediaItems.length - 1 && (
                      <button
                        type="button"
                        onClick={nextSlide}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all z-20 shadow-md cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}

                    {/* Pagination Dots */}
                    <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-none">
                      {mediaItems.map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            currentPreviewIndex === idx
                              ? "bg-white scale-125 shadow"
                              : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Right Column: Sidebar (Author, Caption, Emoji, Birthday Tag, Style Dropdown) */}
              <div className="w-full md:w-[340px] md:h-[580px] flex flex-col justify-between bg-white overflow-y-auto shrink-0">
                <div className="flex flex-col flex-1">
                  {/* Author Row */}
                  <div className="p-4 pb-2 flex items-center gap-3">
                    <Avatar className="w-8 h-8 border border-gray-200">
                      <AvatarImage src={user?.profilePicture} alt={user?.username} />
                      <AvatarFallback className="font-semibold text-xs text-gray-700">
                        {user?.username?.slice(0, 2).toUpperCase() || "CN"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm text-gray-900">
                      {user?.username || "user"}
                    </span>
                  </div>

                  {/* Caption Textarea */}
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={2200}
                    placeholder="Add a caption..."
                    className="w-full px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none flex-1 min-h-[140px] leading-relaxed font-sans"
                  />

                  {/* Emoji & Character Counter */}
                  <div className="relative px-4 pb-3 flex items-center justify-between text-gray-400 select-none">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEmojiPicker((prev) => !prev);
                        }}
                        className={`hover:text-gray-700 transition-colors cursor-pointer p-1 rounded-md ${
                          showEmojiPicker ? "text-[#0095F6] bg-sky-50" : ""
                        }`}
                        title="Add emoji"
                      >
                        <Smile className="w-5 h-5" />
                      </button>

                      {/* Emoji Popover Picker (~60 Smileys, Hearts, Stars) */}
                      {showEmojiPicker && (
                        <div
                          ref={emojiPickerRef}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-9 left-0 w-64 bg-white border border-gray-200 shadow-2xl rounded-xl p-2.5 z-50 animate-in fade-in zoom-in-95"
                        >
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100">
                            <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                              Smileys, Hearts & Stars
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowEmojiPicker(false)}
                              className="text-gray-400 hover:text-gray-600"
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

                    <span className="text-xs">{caption.length}/2,200</span>
                  </div>
                </div>

                {/* Bottom Options: Add Happy Birthday tag & Select Style */}
                <div className="border-t border-gray-100 bg-white">
                  {/* Option 1: Add Happy Birthday tag */}
                  <div
                    onClick={() => setIsBirthdayTag((prev) => !prev)}
                    className="p-4 py-3 flex items-start justify-between gap-3 hover:bg-neutral-50/60 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        <span>Add Happy Birthday tag</span>
                        <span>🎂</span>
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug pr-2">
                        Display a festive Happy Birthday badge on the post photo.
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isBirthdayTag}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsBirthdayTag((prev) => !prev);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out mt-1 focus:outline-none ${
                        isBirthdayTag ? "bg-[#0095F6]" : "bg-neutral-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isBirthdayTag ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Option: Add Music to Post / Entire Carousel */}
                  <div className="p-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3 hover:bg-neutral-50/60 transition-colors select-none">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        <Music className="w-4 h-4 text-rose-500" />
                        <span>Add Music</span>
                      </span>
                      {selectedMusic ? (
                        <div className="flex items-center gap-2 mt-1.5 bg-rose-50/80 border border-rose-200/80 rounded-lg p-1.5 pr-2 max-w-full">
                          {selectedMusic.artworkUrl ? (
                            <img
                              src={selectedMusic.artworkUrl}
                              alt=""
                              className="w-7 h-7 rounded-md object-cover shrink-0 shadow-xs"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-md bg-rose-200 flex items-center justify-center text-rose-700 shrink-0">
                              <Music className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-rose-950 truncate leading-tight">
                              {selectedMusic.trackName}
                            </p>
                            <p className="text-[10px] text-rose-600 truncate mt-0.5">
                              {selectedMusic.artistName}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedMusic(null)}
                            className="text-rose-400 hover:text-rose-700 p-1 rounded-md hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Remove music"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                          One track for the entire post carousel.
                        </p>
                      )}
                    </div>

                    {!selectedMusic ? (
                      <button
                        type="button"
                        onClick={() => setOpenMusicModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-transform active:scale-95 shrink-0 cursor-pointer"
                      >
                        Select
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setOpenMusicModal(true)}
                        className="px-2.5 py-1 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {/* Option 2: AI Style Conversion (One-by-One Mandatory Conversion) */}
                  <div className="p-4 pt-3 border-t border-gray-100 flex flex-col gap-2.5 bg-neutral-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#0095F6]" />
                        <label className="text-sm font-semibold text-gray-900">
                          AI Style Conversion
                        </label>
                        <span className="text-red-500 font-bold">*</span>
                      </div>

                      {/* Status Badge for Current Slide */}
                      {currentItem?.type === "video" ? (
                        <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                          Video (Author Only)
                        </span>
                      ) : currentItem?.isStyled ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <span>✓</span> {getStyleDisplayName(currentItem.style)}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          Style Required
                        </span>
                      )}
                    </div>

                    {/* Overall Progress Indicator if multiple photos */}
                    {totalImageCount > 0 && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                          <span>
                            Photos converted:{" "}
                            <strong className="text-gray-900">{styledImagesCount}</strong> /{" "}
                            <strong className="text-gray-900">{totalImageCount}</strong>
                          </span>
                          <span className="text-[11px] text-gray-400">
                            Slide {currentPreviewIndex + 1} of {mediaItems.length}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#0095F6] h-full transition-all duration-300 rounded-full"
                            style={{
                              width: `${(styledImagesCount / totalImageCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Video Notice Card */}
                    {currentItem?.type === "video" ? (
                      <div className="bg-purple-50/70 border border-purple-200/60 rounded-xl p-3 flex flex-col gap-1 text-xs text-purple-900">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span>🔒</span>
                          <span>Private Video Slide</span>
                        </div>
                        <p className="text-purple-700 leading-snug">
                          This video is visible strictly to you (author). Other users viewing your post see only styled photos. Videos do not require style conversion.
                        </p>
                      </div>
                    ) : (
                      /* Photo Style Selection & Conversion Controls */
                      <div className="flex flex-col gap-2">
                        <div className="relative">
                          <select
                            value={currentItem?.style || ""}
                            disabled={currentItem?.isConverting}
                            onChange={(e) => {
                              const chosenStyle = e.target.value;
                              if (chosenStyle) {
                                transformItemStyleHandler(currentPreviewIndex, chosenStyle);
                              }
                            }}
                            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0095F6] transition-all cursor-pointer appearance-none shadow-sm ${
                              !currentItem?.isStyled
                                ? "border-amber-300 text-neutral-600 hover:border-amber-400"
                                : "border-gray-200 text-gray-900"
                            }`}
                          >
                            <option value="" disabled>
                              {currentItem?.isStyled
                                ? `Change style (Current: ${getStyleDisplayName(currentItem.style)})`
                                : "Select mandatory AI style..."}
                            </option>
                            <option value="ghibli">Studio Ghibli (Hand-painted watercolor animation)</option>
                            <option value="anime">2D Anime (Cel-shaded line art illustration)</option>
                            <option value="pixar">Disney Pixar 3D (Stylized 3D animated character)</option>
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Compare toggle if converted */}
                        {currentItem?.isStyled && (
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setShowOriginal((prev) => !prev)}
                              className="flex-1 py-1.5 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                            >
                              <span>{showOriginal ? "👁️ View Styled" : "👁️ View Original"}</span>
                            </button>
                          </div>
                        )}

                        {!currentItem?.isStyled && !currentItem?.isConverting && (
                          <p className="text-[11px] text-amber-600 font-normal flex items-center gap-1">
                            <span>⚠️</span>
                            <span>Choose one of the 3 styles above to convert this photo.</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Navigation Buttons: Previous Image & Next Image (Requirement 5) */}
                    {mediaItems.length > 1 && (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/80 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowOriginal(false);
                            setCurrentPreviewIndex((prev) => Math.max(0, prev - 1));
                          }}
                          disabled={currentPreviewIndex === 0}
                          className="flex-1 py-2 px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer shadow-sm transition-all active:scale-[0.98]"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Previous Image</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowOriginal(false);
                            setCurrentPreviewIndex((prev) => Math.min(mediaItems.length - 1, prev + 1));
                          }}
                          disabled={currentPreviewIndex === mediaItems.length - 1}
                          className="flex-1 py-2 px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer shadow-sm transition-all active:scale-[0.98]"
                        >
                          <span>Next Image</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ================= DISCARD POST CONFIRMATION MODAL ================= */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setShowDiscardConfirm(false)}
          />

          <div className="relative z-10 w-[320px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden text-center animate-in fade-in zoom-in-95">
            <div className="p-6 pb-4">
              <h3 className="font-semibold text-lg text-gray-900">Discard post?</h3>
              <p className="text-xs text-gray-500 mt-1">
                If you leave, your edits won't be saved.
              </p>
            </div>

            <div className="flex flex-col divide-y divide-gray-100 border-t border-gray-100">
              <button
                type="button"
                onClick={confirmDiscard}
                className="w-full py-3.5 text-red-500 font-bold text-sm hover:bg-neutral-50 transition-colors active:bg-neutral-100 cursor-pointer"
              >
                Discard
              </button>

              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="w-full py-3.5 text-gray-900 font-normal text-sm hover:bg-neutral-50 transition-colors active:bg-neutral-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instagram-Style Music Picker Dialog */}
      <MusicPickerModal
        open={openMusicModal}
        onClose={() => setOpenMusicModal(false)}
        onSelectTrack={(track) => setSelectedMusic(track)}
        selectedTrackId={selectedMusic?.id}
      />
    </div>,
    document.body
  );
};

export default CreatePost;
