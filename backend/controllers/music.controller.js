// Native fetch is built into Node.js 18+ (zero external dependencies)

// In-memory cache for iTunes search results to optimize performance and prevent rate-limiting
const musicCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Normalizes iTunes track item to standard Bloom format
 */
const formatTrack = (track) => {
    // Upscale artwork to 200x200 for crisp rendering
    const artwork = track.artworkUrl100
        ? track.artworkUrl100.replace("100x100bb", "200x200bb")
        : track.artworkUrl60 || "";

    return {
        id: track.trackId?.toString() || Math.random().toString(),
        trackName: track.trackName || "Unknown Track",
        artistName: track.artistName || "Unknown Artist",
        previewUrl: track.previewUrl || "",
        artworkUrl: artwork,
        albumName: track.collectionName || "",
        durationMs: track.trackTimeMillis || 30000,
    };
};

/**
 * GET /api/v1/music/search?query=...
 * Searches iTunes library for songs matching query
 */
export const searchMusic = async (req, res) => {
    try {
        const query = (req.query.query || req.query.term || "").trim();
        if (!query) {
            return res.status(200).json({
                success: true,
                tracks: []
            });
        }

        const cacheKey = `search:${query.toLowerCase()}`;
        const cached = musicCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return res.status(200).json({
                success: true,
                tracks: cached.data
            });
        }

        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=30`;
        const response = await fetch(itunesUrl, {
            headers: {
                "User-Agent": "BloomMusicApp/1.0"
            },
            signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) {
            throw new Error(`iTunes API responded with status ${response.status}`);
        }

        const data = await response.json();
        const rawResults = data?.results || [];

        // Filter out results that lack a preview URL
        const tracks = rawResults
            .filter((item) => item.previewUrl && item.trackName)
            .map(formatTrack);

        musicCache.set(cacheKey, { timestamp: Date.now(), data: tracks });

        return res.status(200).json({
            success: true,
            tracks
        });
    } catch (error) {
        console.error("Error searching iTunes music:", error.message);
        return res.status(500).json({
            message: "Failed to search music",
            success: false,
            tracks: []
        });
    }
};

/**
 * GET /api/v1/music/trending
 * Returns trending Bollywood and global songs for the initial music picker sheet
 */
export const getTrendingMusic = async (req, res) => {
    try {
        const cacheKey = "trending:music:popular";
        const cached = musicCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return res.status(200).json({
                success: true,
                tracks: cached.data
            });
        }

        // Fetch curated Bollywood and top trending tracks
        const itunesUrl = `https://itunes.apple.com/search?term=bollywood+top+hits&media=music&entity=song&limit=30`;
        const response = await fetch(itunesUrl, {
            headers: {
                "User-Agent": "BloomMusicApp/1.0"
            },
            signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) {
            throw new Error(`iTunes API responded with status ${response.status}`);
        }

        const data = await response.json();
        const rawResults = data?.results || [];
        const tracks = rawResults
            .filter((item) => item.previewUrl && item.trackName)
            .map(formatTrack);

        musicCache.set(cacheKey, { timestamp: Date.now(), data: tracks });

        return res.status(200).json({
            success: true,
            tracks
        });
    } catch (error) {
        console.error("Error getting trending music:", error.message);
        return res.status(500).json({
            message: "Failed to fetch trending music",
            success: false,
            tracks: []
        });
    }
};
