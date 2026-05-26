const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

// ─── Provider & Wallet Setup ─────────────────────────────────────────────────

/**
 * Get a configured ethers provider connected to Polygon.
 * Uses Alchemy or public RPC depending on env vars.
 */
const getProvider = () => {
  const rpcUrl = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";
  return new ethers.JsonRpcProvider(rpcUrl);
};

/**
 * Get the minter wallet (signer) used to call mint() on the contract.
 * The private key is stored in MINTER_PRIVATE_KEY env var.
 */
const getMinterWallet = () => {
  const privateKey = process.env.MINTER_PRIVATE_KEY;
  if (!privateKey) throw new Error("MINTER_PRIVATE_KEY is not set in environment.");
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
};

/**
 * Load the KnQNFT contract ABI from the compiled Hardhat artifacts.
 * Falls back to a minimal ABI if artifacts are not available.
 */
const getNFTContract = (signerOrProvider) => {
  const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error("NFT_CONTRACT_ADDRESS is not set.");

  // Try to load compiled ABI from contracts directory
  const artifactPath = path.join(
    __dirname,
    "../../contracts/artifacts/contracts/KnQNFT.sol/KnQNFT.json"
  );

  let abi;
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifact.abi;
  } else {
    // Minimal ABI fallback (only mint and totalMinted)
    abi = [
      "function mint(address to, string calldata tokenURI_, uint96 royaltyBps, address royaltyReceiver) external returns (uint256)",
      "function totalMinted() external view returns (uint256)",
      "function ownerOf(uint256 tokenId) external view returns (address)",
      "function tokenURI(uint256 tokenId) external view returns (string)",
      "event Minted(uint256 indexed tokenId, address indexed to, string tokenURI, address royaltyReceiver, uint96 royaltyBps)"
    ];
  }

  return new ethers.Contract(contractAddress, abi, signerOrProvider);
};

/**
 * Load the KnQAuctionVault contract.
 */
const getVaultContract = (signerOrProvider) => {
  const contractAddress = process.env.VAULT_CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error("VAULT_CONTRACT_ADDRESS is not set.");

  const artifactPath = path.join(
    __dirname,
    "../../contracts/artifacts/contracts/KnQAuctionVault.sol/KnQAuctionVault.json"
  );

  let abi;
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifact.abi;
  } else {
    abi = [
      "function depositBid(string calldata auctionId) external payable",
      "function settleAuction(string calldata auctionId, address nftContract, uint256 tokenId, address payable creator) external",
      "function refundBid(string calldata auctionId) external",
      "function getDeposit(string calldata auctionId) external view returns (tuple(address winner, uint256 amount, bool settled, bool refunded))"
    ];
  }

  return new ethers.Contract(contractAddress, abi, signerOrProvider);
};

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Mint an NFT to the winner's wallet.
 *
 * @param {string} toAddress       - Winner's wallet address
 * @param {string} tokenURI        - ipfs://Qm... metadata URI
 * @param {number} royaltyPct      - Royalty percentage (e.g. 10 for 10%)
 * @param {string} creatorAddress  - Creator's wallet for royalty payments
 * @returns {{ txHash: string, tokenId: number }}
 */
const mintNFT = async (toAddress, tokenURI, royaltyPct = 10, creatorAddress) => {
  const wallet = getMinterWallet();
  const nft = getNFTContract(wallet);

  const royaltyBps = Math.round(royaltyPct * 100); // 10% → 1000 bps

  console.log(`[Web3] Minting NFT → ${toAddress}, royalty: ${royaltyPct}%`);

  const tx = await nft.mint(toAddress, tokenURI, royaltyBps, creatorAddress);
  console.log(`[Web3] Mint tx submitted: ${tx.hash}`);

  const receipt = await tx.wait(1); // Wait for 1 confirmation
  console.log(`[Web3] Mint confirmed in block ${receipt.blockNumber}`);

  // Extract tokenId from the Minted event
  const mintedEvent = receipt.logs
    .map((log) => {
      try { return nft.interface.parseLog(log); } catch { return null; }
    })
    .find((e) => e?.name === "Minted");

  const tokenId = mintedEvent ? Number(mintedEvent.args.tokenId) : null;
  console.log(`[Web3] Token ID: ${tokenId}`);

  return { txHash: receipt.hash, tokenId };
};

/**
 * Settle an auction on-chain via the vault contract.
 * Releases escrowed MATIC to creator and NFT to winner.
 *
 * @param {string} auctionId     - MongoDB auction ID (string)
 * @param {number} tokenId       - NFT token ID to transfer
 * @param {string} creatorWallet - Creator's wallet address
 * @returns {{ txHash: string }}
 */
const settleAuctionOnChain = async (auctionId, tokenId, creatorWallet) => {
  const wallet = getMinterWallet(); // Admin wallet
  const vault = getVaultContract(wallet);
  const nftAddress = process.env.NFT_CONTRACT_ADDRESS;

  const tx = await vault.settleAuction(auctionId, nftAddress, tokenId, creatorWallet);
  const receipt = await tx.wait(1);

  return { txHash: receipt.hash };
};

/**
 * Get the current on-chain owner of a token.
 * @param {number} tokenId
 * @returns {string} wallet address
 */
const getTokenOwner = async (tokenId) => {
  const provider = getProvider();
  const nft = getNFTContract(provider);
  return await nft.ownerOf(tokenId);
};

/**
 * Verify a transaction was confirmed on Polygon.
 * @param {string} txHash
 * @returns {boolean}
 */
const verifyTransaction = async (txHash) => {
  const provider = getProvider();
  const receipt = await provider.getTransactionReceipt(txHash);
  return receipt !== null && receipt.status === 1;
};

/**
 * Get the Polygon explorer URL for a transaction.
 */
const getTxExplorerUrl = (txHash) => {
  const isMainnet = process.env.POLYGON_NETWORK === "mainnet";
  const base = isMainnet
    ? "https://polygonscan.com/tx/"
    : "https://amoy.polygonscan.com/tx/";
  return `${base}${txHash}`;
};

/**
 * Get the OpenSea URL for an NFT.
 */
const getOpenSeaUrl = (tokenId) => {
  const nftAddress = process.env.NFT_CONTRACT_ADDRESS;
  const isMainnet = process.env.POLYGON_NETWORK === "mainnet";
  const base = isMainnet
    ? "https://opensea.io/assets/matic/"
    : "https://testnets.opensea.io/assets/amoy/";
  return `${base}${nftAddress}/${tokenId}`;
};

/**
 * Submit the deposit bid transaction on behalf of the user using minter private key (sponsored/gasless).
 * 
 * @param {string} auctionId 
 * @param {string} maticAmount - Amount in MATIC as string (e.g. "14.285")
 * @returns {{ txHash: string }}
 */
const sponsorDepositBid = async (auctionId, maticAmount) => {
  const wallet = getMinterWallet();
  const vault = getVaultContract(wallet);

  console.log(`[Web3] Sponsoring depositBid for Auction ${auctionId} with ${maticAmount} MATIC...`);

  // Define minimal ABI for depositBid inside the fallback if not present in main artifacts
  const tx = await vault.depositBid(auctionId, {
    value: ethers.parseEther(maticAmount)
  });

  const receipt = await tx.wait(1);
  console.log(`[Web3] Sponsored depositBid confirmed: ${receipt.hash}`);

  return { txHash: receipt.hash };
};

module.exports = {
  mintNFT,
  settleAuctionOnChain,
  getTokenOwner,
  verifyTransaction,
  getTxExplorerUrl,
  getOpenSeaUrl,
  sponsorDepositBid,
};
