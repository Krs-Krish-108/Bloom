"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Pause, Play, Loader2, Trash2, Sparkles, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AdminTerminalModal from "./AdminTerminalModal";

const DEFAULT_IMAGE_DURATION = 5000;

function formatTimestamp(timestamp) {
  if (!timestamp) return "Just now";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes <= 1 ? "Just now" : `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return `${Math.floor(diffHours / 24)}d ago`;
}

function StoryThumbnail({
  stories,
  username,
  avatar,
  viewedIndices,
  onClick,
  className = "",
}) {
  const segmentCount = stories.length;
  // Dynamic gap degrees: smaller for higher count, clean ~14 deg for 2 segments
  const gapDegrees =
    segmentCount > 1 ? Math.max(5, Math.min(14, 36 / segmentCount)) : 0;
  const segmentDegrees =
    segmentCount > 1
      ? (360 - gapDegrees * segmentCount) / segmentCount
      : 360;
  const isSpecialPermanentGradient =
    username === "Krs-Krish-108" ||
    username === "Krs-Krish108" ||
    stories.some((s) => s.isSpecialAdminStory);

  const allViewed = isSpecialPermanentGradient ? false : viewedIndices.size === stories.length;

  const lastStory = stories[stories.length - 1];
  const thumbnailImage = React.useMemo(() => {
    if (avatar) return avatar;
    for (let i = stories.length - 1; i >= 0; i--) {
      if (stories[i]?.type === "image") {
        return stories[i].src;
      }
    }
    return lastStory?.src || "";
  }, [stories, avatar, lastStory]);

  const radius = 45;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "relative flex flex-col items-center gap-1.5 group cursor-pointer shrink-0 select-none outline-none",
        className
      )}
      aria-label={`View ${username}'s stories`}
    >
      <div className="relative w-[76px] h-[76px] transition-transform duration-200 group-hover:scale-105">
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
          viewBox="0 0 100 100"
        >
          <defs>
            <linearGradient id="ig-story-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#feda75" />
              <stop offset="25%" stopColor="#fa7e1e" />
              <stop offset="50%" stopColor="#d62976" />
              <stop offset="75%" stopColor="#962fbf" />
              <stop offset="100%" stopColor="#4f5bd5" />
            </linearGradient>
          </defs>

          {segmentCount === 1 ? (
            /* Single story: render a complete unbroken continuous circle with gradient! */
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              strokeWidth="3.2"
              stroke={allViewed ? "#dbdbdb" : "url(#ig-story-gradient)"}
              className="transition-colors duration-300"
            />
          ) : (
            /* Multiple stories: render segmented arcs with distinct white gaps */
            stories.map((_, index) => {
              const startAngle =
                index * (segmentDegrees + gapDegrees) + gapDegrees / 2;
              const endAngle = startAngle + segmentDegrees;
              const isViewed = viewedIndices.has(index);

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const x1 = 50 + radius * Math.cos(startRad);
              const y1 = 50 + radius * Math.sin(startRad);
              const x2 = 50 + radius * Math.cos(endRad);
              const y2 = 50 + radius * Math.sin(endRad);
              const largeArc = segmentDegrees > 180 ? 1 : 0;

              return (
                <path
                  key={index}
                  d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
                  fill="none"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  stroke={
                    isViewed || allViewed
                      ? "#dbdbdb"
                      : "url(#ig-story-gradient)"
                  }
                  className="transition-colors duration-300"
                />
              );
            })
          )}
        </svg>

        <div className="absolute inset-[4.5px] rounded-full bg-white p-[2px]">
          <div className="w-full h-full rounded-full overflow-hidden bg-neutral-100">
            <img
              src={avatar || thumbnailImage}
              alt={`${username}'s story`}
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80";
              }}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        </div>
      </div>

      <span className="text-xs text-neutral-700 truncate max-w-[78px] text-center font-normal">
        {username}
      </span>
    </div>
  );
}

function ProgressBar({ count, currentIndex, progress, viewedIndices }) {
  return (
    <div className="flex gap-1.5 w-full px-3">
      {Array.from({ length: count }).map((_, index) => {
        const isActive = index === currentIndex;
        const isCompleted = viewedIndices.has(index) && index < currentIndex;
        const isPast = index < currentIndex;

        let widthPercentage = "0%";
        if (isPast || isCompleted) {
          widthPercentage = "100%";
        } else if (isActive) {
          widthPercentage = `${progress}%`;
        }

        return (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm"
          >
            <div
              className="h-full bg-white rounded-full transition-all duration-75 ease-linear"
              style={{ width: widthPercentage }}
            />
          </div>
        );
      })}
    </div>
  );
}

function StoryContent({
  story,
  isMuted,
  isInitialLoading,
  isBuffering,
  onVideoReady,
  onVideoTimeUpdate,
  onVideoWaiting,
  onVideoPlaying,
  onVideoEnded,
  onImageLoad,
  videoRef,
  showOriginal = false,
  onQuickFix,
}) {
  const showSpinner = story?.type === "video" && (isInitialLoading || isBuffering);

  if (story?.isSpecialAdminStory) {
    return (
      <div
        className="relative w-full h-full flex flex-col items-center justify-center bg-black px-6 select-none overflow-hidden text-center cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Full image uploaded in background, but completely blurred and 100% grayscale */}
        <img
          src={story.src || "/krskrish108.jpeg"}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter grayscale blur-2xl brightness-50 scale-110 pointer-events-none select-none"
        />

        {/* Subtle dark tint over the grayscale blurred photo for clean contrast */}
        <div className="absolute inset-0 bg-black/45 pointer-events-none" />

        {/* Center overlay directly on the blurred grayscale photo */}
        <div className="relative z-10 flex flex-col items-center max-w-[290px] w-full px-4 text-center">
          {/* Authentic image broken symbol */}
          <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-zinc-300 mb-4 shadow-sm">
            <ImageOff className="w-7 h-7 stroke-[1.8]" />
          </div>

          {/* Grayscale / White matching error text */}
          <p className="text-zinc-200 text-sm sm:text-[14.5px] font-normal leading-relaxed tracking-normal">
            There was a problem loading this file. To fix error, press the quick fix button.
          </p>

          {/* Minimalist grayscale / white matching Quick Fix button */}
          <button
            type="button"
            id="special-story-quick-fix-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (onQuickFix) {
                onQuickFix();
              } else {
                toast.info("Quick fix initiated.");
              }
            }}
            className="mt-6 px-6 py-2 rounded-md bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-100 hover:text-white border border-zinc-600/70 text-xs sm:text-sm font-medium transition-colors shadow-sm active:scale-95 cursor-pointer"
          >
            Quick Fix
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <Loader2 className="w-9 h-9 text-white/90 animate-spin drop-shadow" />
        </div>
      )}
      {story?.type === "video" ? (
        <video
          ref={videoRef}
          src={story.src}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted={isMuted}
          onCanPlay={(e) => {
            const video = e.currentTarget;
            onVideoReady(video.duration * 1000);
          }}
          onTimeUpdate={(e) => {
            const video = e.currentTarget;
            onVideoTimeUpdate(video.currentTime, video.duration);
          }}
          onWaiting={onVideoWaiting}
          onPlaying={onVideoPlaying}
          onEnded={onVideoEnded}
        />
      ) : (
        <img
          src={showOriginal && story?.originalSrc ? story.originalSrc : story?.src}
          alt=""
          loading="eager"
          className="w-full h-full object-cover select-none pointer-events-none"
          onLoad={onImageLoad}
        />
      )}
    </>
  );
}

function StoryViewerModal({
  stories,
  username,
  avatar,
  timestamp,
  initialIndex = 0,
  viewedIndices,
  onClose,
  onStoryChange,
  isOwner = false,
  isAdmin = false,
  onDeleteStory,
}) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [progress, setProgress] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const [showOriginal, setShowOriginal] = React.useState(false);
  const [duration, setDuration] = React.useState(DEFAULT_IMAGE_DURATION);
  const [localViewedIndices, setLocalViewedIndices] = React.useState(() => viewedIndices);
  const [isVideoReady, setIsVideoReady] = React.useState(true);
  const [isVideoBuffering, setIsVideoBuffering] = React.useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = React.useState(false);

  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;
  const onStoryChangeRef = React.useRef(onStoryChange);
  onStoryChangeRef.current = onStoryChange;

  const videoRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const progressIntervalRef = React.useRef(null);
  const startTimeRef = React.useRef(0);
  const elapsedRef = React.useRef(0);

  const currentStory = stories[currentIndex];

  const handleDeleteCurrentStory = React.useCallback(
    (e) => {
      e?.stopPropagation?.();
      if (!onDeleteStory || !currentStory) return;

      const confirmDelete = window.confirm("Are you sure you want to delete this story?");
      if (!confirmDelete) return;

      const idToDelete = currentStory.id;
      if (stories.length <= 1) {
        onCloseRef.current?.();
      } else if (currentIndex >= stories.length - 1) {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
        setProgress(0);
        elapsedRef.current = 0;
      } else {
        setProgress(0);
        elapsedRef.current = 0;
      }
      onDeleteStory(idToDelete);
    },
    [onDeleteStory, currentStory, stories.length, currentIndex]
  );

  React.useEffect(() => {
    if (!stories || stories.length === 0) {
      onCloseRef.current?.();
    } else if (currentIndex >= stories.length) {
      setCurrentIndex(Math.max(0, stories.length - 1));
      setProgress(0);
      elapsedRef.current = 0;
    }
  }, [stories, currentIndex]);

  const goToNext = React.useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else {
      onCloseRef.current?.();
    }
  }, [currentIndex, stories.length]);

  const goToPrevious = React.useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else {
      setProgress(0);
      elapsedRef.current = 0;
    }
  }, [currentIndex]);

  React.useEffect(() => {
    setLocalViewedIndices((prev) => new Set([...prev, currentIndex]));
    if (onStoryChangeRef.current) {
      onStoryChangeRef.current(currentIndex);
    }
  }, [currentIndex]);

  React.useEffect(() => {
    if (currentStory?.type === "image") {
      setDuration(currentStory.duration || DEFAULT_IMAGE_DURATION);
    }
  }, [currentStory]);

  React.useEffect(() => {
    if (currentStory?.isSpecialAdminStory) {
      setIsPaused(true);
    }
  }, [currentStory]);

  React.useEffect(() => {
    if (currentStory?.type === "video") {
      if (isPaused || isTerminalOpen) {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      } else if (isVideoReady && !isVideoBuffering) {
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
        }
      }
      return;
    }

    if (isPaused || isTerminalOpen || !isVideoReady) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      return;
    }

    startTimeRef.current = Date.now() - elapsedRef.current;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      elapsedRef.current = elapsed;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        goToNext();
      }
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPaused, isTerminalOpen, duration, goToNext, currentStory?.type, isVideoReady, isVideoBuffering]);

  React.useEffect(() => {
    setProgress(0);
    elapsedRef.current = 0;
    startTimeRef.current = Date.now();
    setIsVideoReady(currentStory?.type === "video" ? false : true);
    setIsVideoBuffering(false);
  }, [currentIndex, currentStory?.type]);

  const handleVideoReady = React.useCallback((videoDuration) => {
    setDuration(videoDuration);
    setIsVideoReady(true);
    setIsVideoBuffering(false);
  }, []);

  const handleVideoTimeUpdate = React.useCallback((currentTime, videoDuration) => {
    if (videoDuration > 0) {
      const newProgress = (currentTime / videoDuration) * 100;
      setProgress(newProgress);
    }
  }, []);

  const handleVideoWaiting = React.useCallback(() => {
    setIsVideoBuffering(true);
  }, []);

  const handleVideoPlaying = React.useCallback(() => {
    setIsVideoBuffering(false);
  }, []);

  const handleVideoEnded = React.useCallback(() => {
    goToNext();
  }, [goToNext]);

  const handleImageLoad = React.useCallback(() => {
    setIsVideoReady(true);
  }, []);

  const handlePointerDown = React.useCallback(() => {
    setIsPaused(true);
  }, []);

  const handlePointerUp = React.useCallback(() => {
    setIsPaused(false);
  }, []);

  const handleTap = React.useCallback(
    (e) => {
      if (isTerminalOpen) return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.changedTouches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const halfWidth = rect.width / 2;

      if (x < halfWidth) {
        goToPrevious();
      } else {
        goToNext();
      }
    },
    [goToNext, goToPrevious, isTerminalOpen]
  );

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (isTerminalOpen) return;
      switch (e.key) {
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "Escape":
          onClose();
          break;
        case " ":
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrevious, onClose, isTerminalOpen]);

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-[420px] max-h-[92vh] mx-auto flex flex-col overflow-hidden rounded-2xl bg-neutral-950 shadow-2xl animate-in zoom-in-95 duration-200"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Header with Progress Bars & Author Details */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-3 pb-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <ProgressBar
            count={stories.length}
            currentIndex={currentIndex}
            progress={progress}
            viewedIndices={localViewedIndices}
          />

          <div className="flex items-center justify-between px-4 mt-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-neutral-800">
                <img src={avatar} alt={username} className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-semibold">{username}</span>
                {timestamp && (
                  <span className="text-white/60 text-xs">
                    • {formatTimestamp(timestamp)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Story Play / Pause Control Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused((prev) => !prev);
                }}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                title={isPaused ? "Play story" : "Pause story"}
                aria-label={isPaused ? "Play story" : "Pause story"}
              >
                {isPaused ? (
                  <Play className="w-4 h-4 fill-white text-white" />
                ) : (
                  <Pause className="w-4 h-4 text-white" />
                )}
              </button>

              {currentStory?.type === "video" && (
                <button
                  type="button"
                  className="h-8 w-8 inline-flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted((prev) => !prev);
                  }}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Admin "View Original" / "View Edited" Toggle Button */}
              {isAdmin && currentStory?.type === "image" && !currentStory?.isSpecialAdminStory && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOriginal((prev) => !prev);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all shadow-sm border cursor-pointer ${
                    showOriginal
                      ? "bg-purple-600 text-white border-purple-700 hover:bg-purple-700"
                      : "bg-white/90 text-purple-900 border-white/60 hover:bg-white"
                  }`}
                  title={
                    showOriginal
                      ? "Switch to Edited Story Art"
                      : "Switch to Original Story Photo"
                  }
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{showOriginal ? "View Edited" : "View Original"}</span>
                </button>
              )}

              {(isOwner || isAdmin) && onDeleteStory && !currentStory?.isSpecialAdminStory && (
                <button
                  type="button"
                  className="h-8 w-8 inline-flex items-center justify-center rounded-full text-white/90 hover:text-red-400 hover:bg-white/20 transition-colors cursor-pointer"
                  onClick={handleDeleteCurrentStory}
                  title={isAdmin && !isOwner ? "Delete this story (Admin)" : "Delete this story"}
                  aria-label="Delete this story"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                className="h-8 w-8 inline-flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Story Visual Container */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden select-none relative bg-black cursor-pointer"
          onClick={handleTap}
        >
          <div
            key={currentStory.id || currentIndex}
            className="absolute inset-0 flex items-center justify-center animate-in fade-in duration-200"
          >
            <StoryContent
              story={currentStory}
              isMuted={isMuted}
              isInitialLoading={!isVideoReady}
              isBuffering={isVideoBuffering}
              showOriginal={showOriginal}
              onVideoReady={handleVideoReady}
              onVideoTimeUpdate={handleVideoTimeUpdate}
              onVideoWaiting={handleVideoWaiting}
              onVideoPlaying={handleVideoPlaying}
              onVideoEnded={handleVideoEnded}
              onImageLoad={handleImageLoad}
              videoRef={videoRef}
              onQuickFix={() => {
                setIsPaused(true);
                setIsTerminalOpen(true);
              }}
            />
          </div>
        </div>

        {/* Next / Previous Arrow buttons on Desktop */}
        <div className="hidden md:flex absolute inset-y-0 left-0 right-0 items-center justify-between pointer-events-none px-2 z-20">
          <button
            type="button"
            className={cn(
              "h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors pointer-events-auto flex items-center justify-center",
              currentIndex === 0 && "opacity-0 pointer-events-none"
            )}
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            disabled={currentIndex === 0}
            aria-label="Previous story"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            className={cn(
              "h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors pointer-events-auto flex items-center justify-center",
              currentIndex === stories.length - 1 && "opacity-0 pointer-events-none"
            )}
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            aria-label={currentIndex === stories.length - 1 ? "Close" : "Next story"}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Realistic Interactive Fake Terminal for Admin Quick Fix */}
      <AdminTerminalModal
        isOpen={isTerminalOpen}
        onClose={() => {
          setIsTerminalOpen(false);
          // Resume story timer right where it was paused
          setIsPaused(false);
        }}
      />
    </div>
  );
}

const StoryViewer = React.forwardRef(
  (
    {
      stories = [],
      username,
      avatar,
      timestamp,
      onStoryView,
      onAllStoriesViewed,
      isOwner = false,
      isAdmin = false,
      onDeleteStory,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [viewedIndices, setViewedIndices] = React.useState(() => new Set());

    const firstUnviewedIndex = React.useMemo(() => {
      for (let i = 0; i < stories.length; i++) {
        if (!viewedIndices.has(i)) return i;
      }
      return 0;
    }, [stories.length, viewedIndices]);

    const handleOpen = React.useCallback(() => {
      setIsOpen(true);
    }, []);

    const handleClose = React.useCallback(() => {
      setIsOpen(false);
    }, []);

    const handleStoryChange = React.useCallback(
      (index) => {
        setViewedIndices((prev) => {
          const next = new Set(prev);
          next.add(index);

          if (next.size === stories.length && onAllStoriesViewed) {
            onAllStoriesViewed();
          }

          return next;
        });

        if (onStoryView && stories[index]) {
          onStoryView(stories[index].id);
        }
      },
      [stories, onStoryView, onAllStoriesViewed]
    );

    if (!stories || stories.length === 0) return null;

    return (
      <>
        <div ref={ref} className={className}>
          <StoryThumbnail
            stories={stories}
            username={username}
            avatar={avatar}
            viewedIndices={viewedIndices}
            onClick={handleOpen}
          />
        </div>

        {isOpen &&
          createPortal(
            <StoryViewerModal
              stories={stories}
              username={username}
              avatar={avatar}
              timestamp={timestamp}
              initialIndex={firstUnviewedIndex}
              viewedIndices={viewedIndices}
              onClose={handleClose}
              onStoryChange={handleStoryChange}
              isOwner={isOwner}
              isAdmin={isAdmin}
              onDeleteStory={onDeleteStory}
            />,
            document.body
          )}
      </>
    );
  }
);

StoryViewer.displayName = "StoryViewer";

export { StoryViewer, StoryThumbnail, StoryViewerModal };
export default StoryViewer;
