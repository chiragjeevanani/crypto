const axios = require('axios');

(async () => {
  console.log("RUNNING ITUNES PREVIEW CHECK...");
  try {
    const response = await axios.get("https://itunes.apple.com/search", {
      params: {
        term: "love",
        media: "music",
        entity: "song",
        limit: 3
      },
      timeout: 6000
    });
    console.log(`SUCCESS! Status: ${response.status}`);
    const tracks = response.data?.results || [];
    console.log(`Found tracks count: ${tracks.length}`);
    tracks.forEach((track, i) => {
      console.log(`Track ${i+1}:`, {
        id: track.trackId,
        name: track.trackName,
        artist: track.artistName,
        preview_url: track.previewUrl,
        artwork: track.artworkUrl100
      });
    });
  } catch (err) {
    console.error("FAILED! Message:", err.message);
  }
})();



