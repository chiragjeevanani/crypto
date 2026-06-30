const axios = require("axios");
const Music = require("../models/Music");

/**
 * Normalizes iTunes track format into our app format.
 */
function normalizeTrack(item) {
  if (!item) return null;

  const id = item.trackId ? item.trackId.toString() : (item.collectionId ? item.collectionId.toString() : "");
  const title = item.trackName || "";
  const artist = item.artistName || "Unknown Artist";
  
  // Get higher resolution artwork if possible (replace 100x100 with 400x400)
  let image = item.artworkUrl100 || "";
  if (image && image.includes("100x100")) {
    image = image.replace("100x100", "400x400");
  }

  const preview = item.previewUrl || "";

  return { id, title, artist, image, preview };
}

/**
 * Searches music using iTunes API.
 * Falls back to local database music if API fails.
 */
exports.searchSpotifyMusic = async (query) => {
  // If query is empty, return local fallback immediately
  if (!query || !query.trim()) {
    return await getLocalFallback(query);
  }

  try {
    const response = await axios.get("https://itunes.apple.com/search", {
      params: {
        term: query,
        media: "music",
        entity: "song",
        limit: 20
      },
      timeout: 5000 // 5 seconds timeout
    });

    const tracks = response.data?.results || [];
    const formattedTracks = tracks
      .map(normalizeTrack)
      .filter(t => t && t.id);

    // If API succeeded but returned 0 tracks, try fallback
    if (formattedTracks.length === 0) {
      return await getLocalFallback(query);
    }

    return formattedTracks;
  } catch (error) {
    console.error("iTunes Search API call failed:", error.message);
    // Silent fallback to local database
    return await getLocalFallback(query);
  }
};

/**
 * Helper to query local active tracks and format them
 */
async function getLocalFallback(query) {
  try {
    const dbQuery = { isActive: true };
    if (query) {
      dbQuery.$or = [
        { title: { $regex: query, $options: "i" } },
        { artist: { $regex: query, $options: "i" } }
      ];
    }

    const localTracks = await Music.find(dbQuery).limit(10);
    return localTracks.map(track => ({
      id: track._id.toString(),
      title: track.title,
      artist: track.artist,
      image: track.thumbnail || "",
      preview: track.audioUrl || ""
    }));
  } catch (dbErr) {
    console.error("Local fallback search failed:", dbErr.message);
    return [];
  }
}

