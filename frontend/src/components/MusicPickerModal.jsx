import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Play, Pause, Music, Loader2, Sparkles, Flame, Heart, Headphones } from "lucide-react";
import axios from "axios";
import { MUSIC_API_END_POINT } from "@/utils/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

// Verified popular Bollywood & global tracks with working Apple CDN audio previews and HD artwork
const POPULAR_BOLLYWOOD_HITS = [
  {
    id: "1635014240",
    trackName: "Kesariya (From \"Brahmastra\")",
    artistName: "Pritam, Arijit Singh & Amitabh Bhattacharya",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/38/4c/5c/384c5c8f-3ff8-e457-b2f7-3158ce108649/mzaf_12389299033886433185.plus.aac.p.m4a",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/9f/13/ca/9f13ca3b-e533-03e0-f19a-f0aaa774581d/196589311191.jpg/200x200bb.jpg"
  },
  {
    id: "1653219849",
    trackName: "Apna Bana Le (From \"Bhediya\")",
    artistName: "Arijit Singh, Sachin-Jigar & Amitabh Bhattacharya",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/eb/27/61/eb2761c7-d606-0912-dff0-2dc6b69974bd/mzaf_2023722930851223219.plus.aac.p.m4a",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/2e/0b/c0/2e0bc070-112f-a827-6ad8-6bc64f7caaff/840214460180.png/200x200bb.jpg"
  },
  {
    id: "1705952066",
    trackName: "Chaleya (From \"Jawan\")",
    artistName: "Anirudh Ravichander, Arijit Singh & Shilpa Rao",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/76/05/d9/7605d905-f631-517d-df7f-e162affcd414/mzaf_9976541859961700749.plus.aac.p.m4a",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/bb/f4/f5/bbf4f511-3c12-c25e-a475-b6d06faa8c13/8902894362047_cover.jpg/200x200bb.jpg"
  },
  {
    id: "1722326393",
    trackName: "O Maahi (From \"Dunki\")",
    artistName: "Pritam, Arijit Singh & Irshad Kamil",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/a9/82/78/a9827837-5ca7-1fe3-fc24-3dedeffb86e4/mzaf_4678729972431007397.plus.aac.p.m4a",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/cf/cf/af/cfcfaf49-f337-eeab-2351-dd0a137dc740/8902894362139_cover.jpg/200x200bb.jpg"
  },
  {
    id: "1073359419",
    trackName: "Tum Hi Ho (From \"Aashiqui 2\")",
    artistName: "Mithoon & Arijit Singh",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3a/8c/9b/3a8c9b0b-2def-750a-f615-1555bf941edf/mzaf_17229496441442805917.plus.aac.p.m4a",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/23/ee/bb23eeed-0c35-4f1d-2b11-485622777ae4/8902894353007_cover.jpg/200x200bb.jpg"
  },
  {
    id: "1578079453",
    trackName: "Raataan Lambiyan (From \"Shershaah\")",
    artistName: "Tanishk Bagchi, Jubin Nautiyal & Asees Kaur",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ff/7a/7a/ff7a7a63-9947-cefa-e269-ad9602fb1ca3/mzaf_14039909875904828823.plus.aac.p.m4a",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/c3/df/e7/c3dfe71e-d532-458e-9c1c-32d40f8d9123/886449472222.jpg/200x200bb.jpg"
  },
  {
    id: "1690466656",
    trackName: "Heeriye",
    artistName: "Jasleen Royal & Arijit Singh",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/14/9b/ac/149bac62-12f1-2f55-a742-f38429b94c83/mzaf_17225240189976438593.plus.aac.p.m4a",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/f0/8c/2a/f08c2aeb-3903-8738-d0a5-8c2e4547eed7/5054197711039.jpg/200x200bb.jpg"
  },
  {
    id: "1549728222",
    trackName: "Kahani Suno 2.0",
    artistName: "Kaifi Khalil",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/78/23/75/78237534-1462-7779-165f-502bf22bed03/mzaf_15915982225370167762.plus.aac.p.m4a",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/ff/cc/7b/ffcc7bba-4005-f2c4-b1f1-3cc49a5e6283/artwork.jpg/200x200bb.jpg"
  },
  {
    id: "1348996917",
    trackName: "Tera Yaar Hoon Main",
    artistName: "Arijit Singh & Rochak Kohli",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/44/26/50/442650b7-256e-034a-380a-4bbf16e59e53/mzaf_272051127111758324.plus.aac.p.m4a",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/81/a5/b0/81a5b084-89f7-7ed8-372e-aefd67504922/8902894360074_cover.jpg/200x200bb.jpg"
  },
  {
    id: "1169015785",
    trackName: "Channa Mereya (From \"Ae Dil Hai Mushkil\")",
    artistName: "Pritam & Arijit Singh",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d5/f9/98/d5f998a7-0090-ee2d-03f8-557ad6c5bf65/mzaf_14251357991592637728.plus.aac.p.m4a",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bc/6e/4d/bc6e4d0c-adec-b431-7b60-16f5689f9664/886446201597.jpg/200x200bb.jpg"
  },
  {
    id: "1529528176",
    trackName: "Aaj Se Teri (From \"Padman\")",
    artistName: "Amit Trivedi & Arijit Singh",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bf/e5/cf/bfe5cf41-a4bd-140c-38f4-bb0070a70be1/mzaf_12267608466805504016.plus.aac.p.m4a",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c6/f3/39/c6f339b2-f60e-d726-41ed-e90c999cdd20/8718857707868.png/200x200bb.jpg"
  },
  {
    id: "1189133564",
    trackName: "Enna Sona (From \"OK Jaanu\")",
    artistName: "A.R. Rahman & Arijit Singh",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/5b/b6/d7/5bb6d78f-1bba-c0a9-0731-d3286ed06914/mzaf_1092273590896407309.plus.aac.p.m4a",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/b0/f7/81/b0f78164-e057-e185-da9d-ea90f7251345/886446309835.jpg/200x200bb.jpg"
  },
  {
    id: "1820880896",
    trackName: "Sapphire (feat. Arijit Singh)",
    artistName: "Ed Sheeran",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ad/fd/bc/adfdbcca-c021-eb4f-4832-fbab211a8b2b/mzaf_13305391657250572374.plus.aac.p.m4a",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/29/53/dc/2953dcf9-afe9-82d5-4035-bcaca117849c/5021732833785.jpg/200x200bb.jpg"
  },
  {
    id: "1116089686",
    trackName: "Kabhi Jo Baadal Barse",
    artistName: "Arijit Singh",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/81/ca/29/81ca2932-1f37-a707-cdd7-00cde5599657/mzaf_11967406904724271245.plus.aac.p.m4a",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/8e/f9/13/8ef91340-3e77-13d6-72e6-f0685683f06d/8902894354875_cover.jpg/200x200bb.jpg"
  }
];

// Quick discovery filter chips
const QUICK_CATEGORIES = [
  { label: "Trending", query: "bollywood hits" },
  { label: "Arijit Singh", query: "arijit singh" },
  { label: "Romantic", query: "bollywood romantic" },
  { label: "Shreya Ghoshal", query: "shreya ghoshal" },
  { label: "Sidhu Moosewala", query: "sidhu moosewala" },
  { label: "Lofi & Chill", query: "bollywood lofi" },
  { label: "Global Hits", query: "top hits" },
];

const MusicPickerModal = ({ open, onClose, onSelectTrack, selectedTrackId = null }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState("Trending");
  const [tracks, setTracks] = useState(POPULAR_BOLLYWOOD_HITS);
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

  // Robust Search: Direct iTunes API first (CORS is open on iTunes), then backend fallback
  const executeSearch = useCallback(async (query) => {
    const q = (query || "").trim();
    if (!q) {
      setTracks(POPULAR_BOLLYWOOD_HITS);
      return;
    }

    try {
      setLoading(true);

      // Channel 1: Direct Apple iTunes API call (sub-100ms, CORS open, no cold starts)
      const directUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=30`;
      const res = await fetch(directUrl);
      if (res.ok) {
        const data = await res.json();
        const results = (data.results || [])
          .filter((item) => item.previewUrl && item.trackName)
          .map((item) => ({
            id: item.trackId?.toString() || Math.random().toString(),
            trackName: item.trackName,
            artistName: item.artistName || "Unknown Artist",
            previewUrl: item.previewUrl,
            artworkUrl: item.artworkUrl100
              ? item.artworkUrl100.replace("100x100bb", "200x200bb")
              : item.artworkUrl60 || "",
          }));

        if (results.length > 0) {
          setTracks(results);
          return;
        }
      }

      // Channel 2: Backend proxy fallback
      const backendRes = await axios.get(`${MUSIC_API_END_POINT}/search`, {
        params: { query: q },
        timeout: 4000,
      });
      if (backendRes.data?.success && backendRes.data.tracks?.length > 0) {
        setTracks(backendRes.data.tracks);
        return;
      }

      // Channel 3: Local keyword filter fallback
      const filtered = POPULAR_BOLLYWOOD_HITS.filter(
        (t) =>
          t.trackName.toLowerCase().includes(q.toLowerCase()) ||
          t.artistName.toLowerCase().includes(q.toLowerCase())
      );
      setTracks(filtered.length > 0 ? filtered : POPULAR_BOLLYWOOD_HITS);
    } catch (err) {
      console.warn("Direct iTunes search had an issue, using fallback hits:", err);
      // Fallback: local curated hits
      const filtered = POPULAR_BOLLYWOOD_HITS.filter(
        (t) =>
          t.trackName.toLowerCase().includes(q.toLowerCase()) ||
          t.artistName.toLowerCase().includes(q.toLowerCase())
      );
      setTracks(filtered.length > 0 ? filtered : POPULAR_BOLLYWOOD_HITS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search typing with debounce
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setActiveChip("");

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val);
    }, 300);
  };

  // Quick genre chip click
  const handleChipClick = (chip) => {
    setActiveChip(chip.label);
    setSearchQuery(chip.label);
    executeSearch(chip.query);
  };

  // When modal opens, start with rich POPULAR_BOLLYWOOD_HITS right away
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setActiveChip("Trending");
      setTracks(POPULAR_BOLLYWOOD_HITS);
      // Also trigger a background fetch for extra fresh hits
      executeSearch("bollywood hits");
    } else {
      stopPreview();
    }
  }, [open, executeSearch, stopPreview]);

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
            <div>
              <DialogTitle className="text-base font-bold text-neutral-900 leading-tight">
                Add Music
              </DialogTitle>
              <p className="text-[11px] text-neutral-500">
                {tracks.length} songs available
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        {/* Search Input Bar */}
        <div className="px-4 pt-3 pb-2 flex flex-col gap-2">
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
                  setActiveChip("Trending");
                  setTracks(POPULAR_BOLLYWOOD_HITS);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Genre Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar select-none text-[11px]">
            {QUICK_CATEGORIES.map((chip) => {
              const isActive = activeChip === chip.label;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Songs List */}
        <div className="max-h-[360px] min-h-[260px] overflow-y-auto px-3 py-1 divide-y divide-neutral-100">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-700" />
              <span className="text-xs">Finding songs...</span>
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-400">
              No matching tracks found. Try searching another song.
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
                        loading="lazy"
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
                      <div className="flex items-end gap-0.5 h-3 px-1">
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
          Powered by iTunes 30s previews • Tap album cover to listen
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MusicPickerModal;
