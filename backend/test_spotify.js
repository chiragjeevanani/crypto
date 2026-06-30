require('dotenv').config();
const axios = require('axios');

(async () => {
  const apiKey = process.env.RAPID_API_KEY;
  const apiHost = process.env.RAPIDAPI_HOST || "spotify23.p.rapidapi.com";
  
  console.log("RAPID_API_KEY:", apiKey ? "Present" : "Missing");
  console.log("RAPIDAPI_HOST:", apiHost);

  // Try minimal parameters first
  try {
    console.log("Testing search with minimal parameters (q, type)...");
    const response = await axios.get(`https://${apiHost}/search/`, {
      params: {
        q: "dilo",
        type: "tracks"
      },
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": apiHost
      }
    });
    console.log("Minimal params SUCCESS! Result structure keys:", Object.keys(response.data));
  } catch (err) {
    console.error("Minimal params failed!");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Error data:", JSON.stringify(err.response.data));
    } else {
      console.error("Message:", err.message);
    }
  }

  // Try standard web-api params if search/ endpoint has changed
  try {
     console.log("Testing alternate search endpoint /search (no trailing slash)...");
     const response = await axios.get(`https://${apiHost}/search`, {
       params: {
         q: "dilo",
         type: "track", // standard spotify uses "track" instead of "tracks"
         limit: 10
       },
       headers: {
         "x-rapidapi-key": apiKey,
         "x-rapidapi-host": apiHost
       }
     });
     console.log("Alternate params SUCCESS! Result structure keys:", Object.keys(response.data));
  } catch (err) {
     console.error("Alternate params failed!");
     if (err.response) {
       console.error("Status:", err.response.status);
       console.error("Error data:", JSON.stringify(err.response.data));
     } else {
       console.error("Message:", err.message);
     }
  }
})();
