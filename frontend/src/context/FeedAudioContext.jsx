import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

const FeedAudioContext = createContext(null);

export const FeedAudioProvider = ({ children }) => {
  const [activePostId, setActivePostId] = useState(null);
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // Map of registered posts: postId -> { element, music }
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
      // If there's an active track that was paused due to autoplay policy, try playing it now
      const audio = audioRef.current;
      if (audio.src && audio.paused && !isMuted && activeTrack?.previewUrl) {
        audio.play().catch(() => {});
      }
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
  }, [isMuted, activeTrack]);

  const [isStoryActive, setIsStoryActive] = useState(false);

  // Viewport Midline Scroll Evaluation
  // STRICT RULE: A post's music is active ONLY if the post spans across the horizontal center line of the screen
  const checkMidlinePost = useCallback(() => {
    // If a story is open, feed audio MUST NOT play!
    if (isStoryActive) {
      audioRef.current.pause();
      return;
    }

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

        if (!isVideoActive && !isMuted) {
          if (audio.src !== foundMusic.previewUrl) {
            audio.src = foundMusic.previewUrl;
          }
          audio.currentTime = 0;
          audio.muted = false;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        } else {
          audio.pause();
        }
      } else {
        // No post or post without music on midline: immediately pause
        setActiveTrack(null);
        audio.pause();
      }
    }
  }, [activePostId, isMuted, isStoryActive]);

  // Schedule midline check with requestAnimationFrame
  const scheduleMidlineCheck = useCallback(() => {
    if (rafIdRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      checkMidlinePost();
      rafIdRef.current = null;
    });
  }, [checkMidlinePost]);

  // Register a post element for scroll monitoring
  const registerPost = useCallback((postId, element, music) => {
    if (!postId || !element) return;
    registeredPostsRef.current.set(postId, { element, music });
    // Immediately check if this newly registered post should be active
    scheduleMidlineCheck();
  }, [scheduleMidlineCheck]);

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

  // Direct play trigger (e.g. user taps speaker button or music badge)
  const playPostMusic = useCallback((postId, music) => {
    if (!postId || !music?.previewUrl) return;

    setActivePostId(postId);
    setActiveTrack(music);
    setIsMuted(false);

    const audio = audioRef.current;
    if (audio.src !== music.previewUrl) {
      audio.src = music.previewUrl;
      audio.currentTime = 0;
    }
    audio.muted = false;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Direct play failed:", err);
      });
    }
  }, []);

  // Listen to window scroll & resize events
  useEffect(() => {
    const handleScroll = () => {
      scheduleMidlineCheck();
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
  }, [scheduleMidlineCheck]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      const audio = audioRef.current;
      audio.muted = next;
      if (!next && activeTrack?.previewUrl && !videoPlayingRef.current.has(activePostId)) {
        audio.play().catch(() => {});
      }
      return next;
    });
  }, [activeTrack, activePostId]);

  const setStoryActive = useCallback((active) => {
    setIsStoryActive(active);
    if (active) {
      audioRef.current.pause();
    } else {
      scheduleMidlineCheck();
    }
  }, [scheduleMidlineCheck]);

  return (
    <FeedAudioContext.Provider
      value={{
        activePostId,
        activeTrack,
        isPlaying,
        isMuted,
        toggleMute,
        playPostMusic,
        registerPost,
        unregisterPost,
        setVideoPlaying,
        userInteracted,
        setStoryActive,
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
