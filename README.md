# KnQ Reels — Web3 NFT & Auction Integration

This project integrates a production-ready Web3 NFT minting and auction settlement system into the KnQ Reels platform. It enables creators to tokenize their content as NFTs on the Polygon blockchain with built-in royalty support.

---

## 🚀 Key Features

- **NFT Minting (ERC-721)**: Automatic minting of auction winners' assets using the ERC-2981 royalty standard.
- **Secure Escrow (KnQAuctionVault)**: A smart contract-based vault that holds winner payments in MATIC until the NFT is successfully delivered.
- **Decentralized Storage**: Media and metadata are permanently pinned to IPFS via Pinata.
- **Multi-Chain Ready**: Configured for Polygon Amoy (Testnet) and Polygon PoS (Mainnet).
- **Secondary Market Sync**: Real-time tracking of NFT transfers on external marketplaces (OpenSea, etc.) via Alchemy Webhooks.
- **Creator Royalties**: Permanent on-chain earnings (0-30%) for creators on every resale.

---

## 🛠 Tech Stack

- **Smart Contracts**: Solidity, Hardhat, Ethers.js
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Frontend**: React, Vite, Tailwind CSS
- **Web3 Tools**: Wagmi, Viem, RainbowKit
- **Infrastructure**: Pinata (IPFS), Alchemy (RPC & Webhooks), Polygon Network

---

## 📦 Installation & Setup

### 1. Smart Contracts
```bash
cd contracts
npm install
# Deploy to Amoy Testnet
npx hardhat run scripts/deploy.js --network amoy
```
*Take note of the `KnQNFT` and `KnQAuctionVault` addresses.*

### 2. Backend Configuration
Update your `backend/.env` with the following:
```env
# Web3 Settings
ENABLE_WEB3=true
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
NFT_CONTRACT_ADDRESS=0x...
VAULT_CONTRACT_ADDRESS=0x...
MINTER_PRIVATE_KEY=0x...

# IPFS Settings (Pinata)
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret
PINATA_JWT=your_jwt
```

### 3. Frontend Configuration
Update your `frontend/.env`:
```env
VITE_ENABLE_WEB3=true
VITE_POLYGON_NETWORK=testnet
VITE_NFT_CONTRACT_ADDRESS=0x...
VITE_VAULT_CONTRACT_ADDRESS=0x...
VITE_WALLETCONNECT_PROJECT_ID=your_id
```

---

## 🧪 Testing the Workflow

1. **Create**: A creator initiates an auction and sets a **Royalty %**.
2. **End**: Once the auction ends, the Admin clicks **"Prepare IPFS"** in the dashboard.
3. **Claim**: The winner connects their wallet (MetaMask) and clicks **"Claim NFT"** to escrow MATIC.
4. **Mint**: The Admin (or automated service) clicks **"Mint NFT"** to finalize the on-chain ownership.
5. **Collection**: The user views their NFT in the **"My Collection"** tab.

---

## 📁 Project Structure

- `/contracts`: Solidity sources, deployment scripts, and Hardhat config.
- `/backend/services/ipfsService.js`: Handles pinning to Pinata.
- `/backend/services/web3Service.js`: Low-level blockchain interaction logic.
- `/backend/controllers/nftController.js`: Business logic for wallet linking and minting.
- `/frontend/src/web3config.js`: Centralized Wagmi/RainbowKit configuration.
- `/frontend/src/modules/nft`: UI components for Marketplace and User Collection.

---

## 🔒 Security

- Private keys must **NEVER** be committed to Git. Use the `.env` file and ensure it is in `.gitignore`.
- Admin endpoints are protected by `authorize(["Admin", "super_admin"])` middleware.
- KYC checks are enforced for Indian creators before minting permissions are granted.

---

## 📄 License

Proprietary — All Rights Reserved.
