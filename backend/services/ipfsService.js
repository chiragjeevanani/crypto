const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

/**
 * Pin a local file to IPFS via Pinata.
 * @param {string} filePath - Absolute path to the local file
 * @param {string} name     - Display name for the pin
 * @returns {Promise<string>} ipfs://Qm... URI
 */
const pinFileToPinata = async (filePath, name = "KnQ NFT Asset") => {
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  form.append(
    "pinataMetadata",
    JSON.stringify({ name })
  );
  form.append(
    "pinataOptions",
    JSON.stringify({ cidVersion: 1 })
  );

  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    form,
    {
      headers: {
        ...form.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      },
      maxBodyLength: Infinity,
    }
  );

  return `ipfs://${res.data.IpfsHash}`;
};

/**
 * Pin a Cloudinary URL to IPFS via Pinata (for already-uploaded media).
 * @param {string} url  - Cloudinary or public URL
 * @param {string} name - Display name for the pin
 * @returns {Promise<string>} ipfs://Qm... URI
 */
const pinUrlToPinata = async (url, name = "KnQ NFT Asset") => {
  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinByHash",
    null,
    {
      // Pinata can't pin arbitrary URLs by hash — use the file-from-URL approach
    }
  );

  // Instead: download the file and re-pin it
  const fileRes = await axios.get(url, { responseType: "arraybuffer" });
  const buffer = Buffer.from(fileRes.data);
  const tmpPath = path.join(process.cwd(), "uploads", `tmp_${Date.now()}`);
  fs.writeFileSync(tmpPath, buffer);

  try {
    const ipfsUri = await pinFileToPinata(tmpPath, name);
    return ipfsUri;
  } finally {
    fs.unlink(tmpPath, () => {});
  }
};

/**
 * Build OpenSea-compatible NFT metadata JSON and pin it to IPFS.
 * @param {object} auction   - Auction document from MongoDB
 * @param {string} ipfsFileUri - ipfs://Qm... for the media file
 * @returns {Promise<string>} ipfs://Qm... URI for the metadata JSON
 */
const generateAndPinMetadata = async (auction, ipfsFileUri) => {
  const mediaType = auction.mediaType || "image";
  const isVideo = mediaType === "video";
  const isAudio = mediaType === "audio";

  const metadata = {
    name: auction.title,
    description: auction.description,
    // `image` is always required by OpenSea (use a thumbnail for video/audio)
    image: isVideo || isAudio ? ipfsFileUri : ipfsFileUri,
    // `animation_url` is used by OpenSea for video, audio, HTML
    ...(isVideo || isAudio ? { animation_url: ipfsFileUri } : {}),
    external_url: `${process.env.FRONTEND_URL}/nfts/${auction._id}`,
    attributes: [
      {
        trait_type: "Creator",
        value: auction.creator?.handle
          ? `@${auction.creator.handle}`
          : auction.creator?.name || "Unknown"
      },
      {
        trait_type: "Country",
        value: auction.creator?.countryName || auction.creator?.countryCode || "India"
      },
      {
        trait_type: "Media Type",
        value:
          mediaType === "video"
            ? "Video / Reel"
            : mediaType === "audio"
            ? "Music"
            : "Image / Photo / GIF"
      },
      {
        trait_type: "Royalty",
        value: `${auction.royaltyPct || 10}%`
      },
      {
        trait_type: "Platform",
        value: "KnQ Reels"
      },
      {
        trait_type: "Auction ID",
        value: auction._id.toString()
      }
    ]
  };

  // Pin the metadata JSON
  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      pinataContent: metadata,
      pinataMetadata: { name: `KnQ NFT Metadata — ${auction.title}` },
      pinataOptions: { cidVersion: 1 }
    },
    {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      }
    }
  );

  return `ipfs://${res.data.IpfsHash}`;
};

/**
 * Full pipeline: pin the auction's media to IPFS, then pin the metadata.
 * Called when an admin approves an auction for NFT minting.
 *
 * @param {object} auction - Populated Auction document
 * @returns {{ ipfsFileUri: string, ipfsMetadataUri: string }}
 */
const prepareAuctionForIPFS = async (auction) => {
  if (!PINATA_API_KEY || !PINATA_API_SECRET) {
    throw new Error("Pinata API keys are not configured. Set PINATA_API_KEY and PINATA_API_SECRET.");
  }

  // 1. Pin the media file (from Cloudinary URL or local path)
  const mediaUrl = auction.mediaUrl;
  console.log(`[IPFS] Pinning media for auction ${auction._id}: ${mediaUrl}`);
  const ipfsFileUri = await pinUrlToPinata(mediaUrl, `KnQ Asset — ${auction.title}`);
  console.log(`[IPFS] Media pinned: ${ipfsFileUri}`);

  // 2. Generate and pin the metadata
  const ipfsMetadataUri = await generateAndPinMetadata(auction, ipfsFileUri);
  console.log(`[IPFS] Metadata pinned: ${ipfsMetadataUri}`);

  return { ipfsFileUri, ipfsMetadataUri };
};

/**
 * Get a public HTTP gateway URL for an IPFS URI.
 * Use this to display the content in a browser (browsers can't load ipfs:// directly).
 * @param {string} ipfsUri - ipfs://Qm...
 * @returns {string} https://gateway.pinata.cloud/ipfs/Qm...
 */
const ipfsToGatewayUrl = (ipfsUri) => {
  if (!ipfsUri) return "";
  return ipfsUri.replace("ipfs://", PINATA_GATEWAY);
};

module.exports = {
  pinFileToPinata,
  pinUrlToPinata,
  generateAndPinMetadata,
  prepareAuctionForIPFS,
  ipfsToGatewayUrl,
};
