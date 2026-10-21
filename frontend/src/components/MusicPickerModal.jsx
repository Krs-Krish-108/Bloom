import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Play, Pause, Music, Loader2, Check } from "lucide-react";
import axios from "axios";
import { MUSIC_API_END_POINT } from "@/utils/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

const MusicPickerModal = ({ open, onClose, onSelectTrack, selectedTrackId = null }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewTrackId, setPreviewTrackId] = useState(null);

  const previewAudioRef = useRef(new Audio());
  const debounceTimerRef = useRef(null);

  // Stop preview audio when modal closes or unmounts
  const stopPreview = useCallback(() => {
    const audio = previewAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
    }
    setPreviewTrackId(null);
  }, []);

  useEffect(() => {
    const audio = previewAudioRef.current;
    const onEnded = () => setPreviewTrackId(null);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("ended", onEnded);
      stopPreview();
    };
  }, [stopPreview]);

  // Fetch trending songs when opening with empty query
  const fetchTrendingTracks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${MUSIC_API_END_POINT}/trending`);
      if (res.data?.success) {
        setTracks(res.data.tracks || []);
      }
    } catch (err) {
      console.error("Failed to load trending music:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search songs via iTunes backend proxy
  const searchTracks = useCallback(async (query) => {
    if (!query.trim()) {
      fetchTrendingTracks();
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${MUSIC_API_END_POINT}/search`, {
        params: { query: query.trim() },
      });
      if (res.data?.success) {
        setTracks(res.data.tracks || []);
      }
    } catch (err) {
      console.error("Failed to search music:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchTrendingTracks]);

  // Handle search typing with debounce
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      searchTracks(val);
    }, 350);
  };

  // Load trending when modal opens
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      fetchTrendingTracks();
    } else {
      stopPreview();
    }
  }, [open, fetchTrendingTracks, stopPreview]);

  // Toggle 30s preview playback
  const handleTogglePreview = (e, track) => {
    e.stopPropagation();
    const audio = previewAudioRef.current;

    if (previewTrackId === track.id) {
      // Pause
      audio.pause();
      setPreviewTrackId(null);
    } else {
      // Play new track preview
      audio.pause();
      audio.src = track.previewUrl;
      audio.currentTime = 0;
      audio.play().catch(() => {});
      setPreviewTrackId(track.id);
    }
  };

  const handleSelect = (track) => {
    stopPreview();
    onSelectTrack({
      trackName: track.trackName,
      artistName: track.artistName,
      previewUrl: track.previewUrl,
      artworkUrl: track.artworkUrl,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white rounded-2xl shadow-2xl border border-neutral-200">
        <DialogHeader className="p-4 pb-2 border-b border-neutral-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <Music className="w-4 h-4" />
            </div>
            <DialogTitle className="text-base font-bold text-neutral-900">
              Add Music
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        {/* Search Input Bar */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search songs, artists (e.g. Arijit Singh, Kesariya)..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-neutral-100 border border-neutral-200/80 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-neutral-900 placeholder:text-neutral-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  fetchTrendingTracks();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Songs List */}
        <div className="max-h-[360px] min-h-[240px] overflow-y-auto px-3 py-1 divide-y divide-neutral-100">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-700" />
              <span className="text-xs">Searching songs...</span>
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-400">
              No matching tracks found. Try another search.
            </div>
          ) : (
            tracks.map((track) => {
              const isSelected = selectedTrackId === track.id;
              const isPreviewing = previewTrackId === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => handleSelect(track)}
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer group ${
                    isSelected ? "bg-rose-50/60" : ""
                  }`}
                >
                  {/* Left: Artwork with Preview Play Button Overlay */}
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-neutral-200 shadow-xs">
                    {track.artworkUrl ? (
                      <img
                        src={track.artworkUrl}
                        alt={track.trackName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400">
                        <Music className="w-5 h-5" />
                      </div>
                    )}

                    {/* Preview Play/Pause button on artwork */}
                    <button
                      type="button"
                      onClick={(e) => handleTogglePreview(e, track)}
                      className={`absolute inset-0 flex items-center justify-center bg-black/40 text-white transition-opacity ${
                        isPreviewing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                      title={isPreviewing ? "Pause preview" : "Listen preview"}
                    >
                      {isPreviewing ? (
                        <Pause className="w-4 h-4 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Middle: Song Details */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="text-[13px] font-semibold text-neutral-900 truncate leading-tight">
                      {track.trackName}
                    </h4>
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                      {track.artistName}
                    </p>
                  </div>

                  {/* Right: Select Button / Indicator */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {isPreviewing && (
                      <div className="flex items-center gap-0.5 h-3 px-1">
                        <span className="w-0.5 h-3 bg-rose-500 animate-pulse" />
                        <span className="w-0.5 h-2 bg-rose-500 animate-pulse delay-75" />
                        <span className="w-0.5 h-3.5 bg-rose-500 animate-pulse delay-150" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(track);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-transform active:scale-95 cursor-pointer"
                    >
                      Select
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info note */}
        <div className="p-2.5 bg-neutral-50 border-t border-neutral-100 text-[11px] text-neutral-400 text-center select-none">
          Songs powered by iTunes 30s official previews
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MusicPickerModal;
