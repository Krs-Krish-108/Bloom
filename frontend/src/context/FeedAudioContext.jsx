import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

const FeedAudioContext = createContext(null);

export const FeedAudioProvider = ({ children }) => {
  const [activePostId, setActivePostId] = useState(null);
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // Map of registered posts: postId -> { elementRef, music, isVideoPlaying }
  const registeredPostsRef = useRef(new Map());
  const audioRef = useRef(new Audio());
  const rafIdRef = useRef(null);
  const videoPlayingRef = useRef(new Set());

  // Configure global feed audio element
  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;
    audio.preload = "auto";

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Update volume / muted state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Track initial user interaction (required by browser autoplay policies)
  useEffect(() => {
    const unlockAudio = () => {
      setUserInteracted(true);
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };

    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  // Register a post element for scroll monitoring
  const registerPost = useCallback((postId, element, music) => {
    if (!postId || !element) return;
    registeredPostsRef.current.set(postId, { element, music });
  }, []);

  const unregisterPost = useCallback((postId) => {
    if (!postId) return;
    registeredPostsRef.current.delete(postId);
    videoPlayingRef.current.delete(postId);
  }, []);

  // Video playback override: if video in active post starts playing, pause post music
  const setVideoPlaying = useCallback((postId, playing) => {
    if (playing) {
      videoPlayingRef.current.add(postId);
    } else {
      videoPlayingRef.current.delete(postId);
    }

    // If video on the currently active post changed, adapt music playback
    if (postId === activePostId) {
      const audio = audioRef.current;
      if (playing) {
        audio.pause();
      } else if (activeTrack?.previewUrl && !isMuted) {
        audio.play().catch(() => {});
      }
    }
  }, [activePostId, activeTrack, isMuted]);

  // Viewport Midline Scroll Evaluation
  // Evaluates which post crosses the horizontal center line of the screen
  const checkMidlinePost = useCallback(() => {
    const midlineY = window.innerHeight / 2;
    let foundPostId = null;
    let foundMusic = null;

    for (const [postId, data] of registeredPostsRef.current.entries()) {
      const el = data.element;
      if (!el) continue;
      const rect = el.getBoundingClientRect();

      // Check if this post spans across the horizontal center line
      if (rect.top <= midlineY && rect.bottom >= midlineY) {
        foundPostId = postId;
        foundMusic = data.music;
        break;
      }
    }

    if (foundPostId !== activePostId) {
      setActivePostId(foundPostId);
      const audio = audioRef.current;

      if (foundMusic && foundMusic.previewUrl) {
        setActiveTrack(foundMusic);
        const isVideoActive = videoPlayingRef.current.has(foundPostId);

        if (!isVideoActive) {
          if (audio.src !== foundMusic.previewUrl) {
            audio.src = foundMusic.previewUrl;
          }
          audio.currentTime = 0;
          audio.play().catch(() => {
            // Autoplay blocked by browser until user interaction
          });
        } else {
          audio.pause();
        }
      } else {
        // Post has NO music attached: pause any currently playing audio
        setActiveTrack(null);
        audio.pause();
      }
    }
  }, [activePostId]);

  // Listen to window scroll & resize events
  useEffect(() => {
    const handleScroll = () => {
      if (rafIdRef.current) return;
      rafIdRef.current = requestAnimationFrame(() => {
        checkMidlinePost();
        rafIdRef.current = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [checkMidlinePost]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (!next && activeTrack?.previewUrl && !videoPlayingRef.current.has(activePostId)) {
        audioRef.current.play().catch(() => {});
      }
      return next;
    });
  }, [activeTrack, activePostId]);

  return (
    <FeedAudioContext.Provider
      value={{
        activePostId,
        activeTrack,
        isPlaying,
        isMuted,
        toggleMute,
        registerPost,
        unregisterPost,
        setVideoPlaying,
        userInteracted,
      }}
    >
      {children}
    </FeedAudioContext.Provider>
  );
};

export const useFeedAudio = () => {
  const context = useContext(FeedAudioContext);
  return context || {};
};

export default FeedAudioContext;
