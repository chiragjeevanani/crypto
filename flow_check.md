# Web3 Marketplace & Auction Flow Check

## Overview

This document outlines the complete web3 flows for the marketplace and auction system, identifying breakpoints and missing connections.

---

## Network Configuration

- **Production:** Polygon Mainnet
- **Testnet:** Polygon Amoy
- **Wallet:** RainbowKit + Wagmi
- **NFT Contract:** `VITE_NFT_CONTRACT_ADDRESS`
- **Vault Contract:** `VITE_VAULT_CONTRACT_ADDRESS`
- **IPFS:** Pinata gateway
- **Marketplace:** OpenSea (Polygon)

---

## Auction Flow

### Flow 1: Create Auction

| Step | Actor | Action | On-chain? | Notes |
|------|-------|--------|-----------|-------|
| 1 | User | Fill form (title, media, dates, royalty) | No | Frontend only |
| 2 | User | Pay listing fee | No | Razorpay INR — converts to platform coins |
| 3 | User | Submit auction | No | POST `/api/auctions` with Razorpay signature |
| 4 | Backend | Verify payment, upload to Cloudinary | No | Status set to `pending` |
| 5 | Admin | Approve auction | No | Status -> `live`, socket broadcast |

**Breakpoint 1:** Auction creation is 100% fiat. No web3 involvement.

---

### Flow 2: Bidding

| Step | Actor | Action | On-chain? | Notes |
|------|-------|--------|-----------|-------|
| 1 | User | Place bid | No | POST `/api/auctions/:id/bid` |
| 2 | Backend | Validate bid > current highest | No | Deducts from `rechargeCoins` |
| 3 | Backend | Anti-snipe: extend endDate | No | +5 min if bid in last 2 min |
| 4 | Backend | Update highest bid / winner | No | Socket `new_bid` broadcast |

**Breakpoint 2:** Bidding uses platform coins only. No MATIC involved.

---

### Flow 3: Auction End & Settlement

| Step | Actor | Action | On-chain? | Notes |
|------|-------|--------|-----------|-------|
| 1 | System | Cron job `processEndedAuctions()` | No | Runs every 60s |
| 2 | Backend | Deduct from winner's coins | No | Creates `WalletTransaction` |
| 3 | Backend | Credit creator's coins | No | After commission + GST |
| 4 | Backend | Set status = `ended` | No | Socket `auction_ended` |

**Breakpoint 3:** Settlement is in platform coins. No NFT minted yet, no MATIC transferred.

---

### Flow 4: Prepare IPFS (NFT Minting Step 1)

| Step | Actor | Action | On-chain? | Notes |
|------|-------|--------|-----------|-------|
| 1 | Admin | Click "Prepare IPFS" | No | POST `/api/nft/admin/prepare/:auctionId` |
| 2 | Backend | Download media from Cloudinary | No | To temp file |
| 3 | Backend | Upload media to IPFS via Pinata | Yes | Returns `ipfs://Qm...` |
| 4 | Backend | Generate & pin metadata JSON | Yes | OpenSea-compatible |
| 5 | Backend | Update `ipfsFileUri`, `ipfsMetadataUri` | No | `nftStatus = 'ipfs_ready'` |

**Breakpoint 4:** IPFS URIs stored in auction doc. Ready for minting.

---

### Flow 5: Mint NFT (NFT Minting Step 2)

| Step | Actor | Action | On-chain? | Notes |
|------|-------|--------|-----------|-------|
| 1 | Admin | Click "Mint NFT" | No | POST `/api/nft/admin/mint/:auctionId` |
| 2 | Backend | Call `mintNFT()` on chain | Yes | Mints to **VAULT contract** |
| 3 | Backend | Store `tokenId`, `contractAddress`, `mintTxHash` | No | `nftStatus = 'minted'` |
| 4 | Backend | Create `NFTOwnership` record | No | Links winner's wallet |

**Note:** The NFT is minted to the **vault contract address**, not directly to the winner. The vault must hold the NFT before `settleAuction()` can execute the atomic swap.

---

### Flow 6: Winner Claims NFT

| Step | Actor | Action | On-chain? | Notes |
|------|-------|--------|-----------|-------|
| 1 | Winner | Open ClaimNFTPage | No | Must be winner + connected wallet |
| 2 | Winner | Connect wallet | Yes | RainbowKit + Wagmi |
| 3 | Winner | Link wallet to account | No | Shown as "Step 1" if not already linked |
| 4 | Winner | Click "Claim" | Yes | Calls `depositBid(auctionId)` on vault |
| 5 | Winner | Send MATIC value to vault | Yes | Amount = `highestBid * maticPrice` (fetched live) |
| 6 | Winner | Record deposit txHash to backend | No | POST `/api/nft/admin/record-deposit` |
| 7 | Backend | Update `nftStatus = 'deposit_received'` | No | Ready for settlement |

**MATIC price is fetched live from CoinGecko** (`GET /api/config/matic-price`, cached 5 min, fallback 7 INR/MATIC).

---

### Flow 7: Vault Settlement (ON-CHAIN)

| Step | Actor | Action | On-chain? | Notes |
|------|-------|--------|-----------|-------|
| 1 | System | Cron job `processVaultSettlements()` | No | Runs every 65s, queries `nftStatus === 'deposit_received'` |
| 2 | Backend | Validate `tokenId`, `winner.walletAddress` | No | `nftController.js:493-541` |
| 3 | Backend | Call `settleAuctionOnChain()` | Yes | `web3Service.js:133` |
| 4 | Chain | Vault transfers NFT to winner | Yes | Via `safeTransferFrom` |
| 5 | Chain | Vault sends MATIC to creator (minus commission) | Yes | Via native transfer |
| 6 | Backend | Set `nftStatus = 'settled'` | No | On success, or `failed_settle` on error |

**Settlement is now automated** via `setInterval(processVaultSettlements, 65 * 1000)` in `app.js:95-97`.

**Gap:** No batch limit - if many auctions accumulate, could attempt too many simultaneous on-chain transactions. Consider adding `.limit(10)` to query.

---

## Marketplace Flow

### Flow M1: View Marketplace

| Step | Actor | Action | On-chain? | Notes |
|------|-------|--------|-----------|-------|
| 1 | User | Browse NFT Marketplace | No | GET `/api/nft/marketplace` |
| 2 | Backend | Filter auctions `nftStatus === 'minted'` | No | Returns token metadata with pagination |

---

### Flow M2: View NFT Detail

| Step | Actor | Action | On-chain? | Notes |
|------|-------|--------|-----------|-------|
| 1 | User | Open NFT detail | No | GET `/api/nft/:tokenId` |
| 2 | Backend | Lookup auction + ownership history | No | MongoDB queries |
| 3 | Backend | (optional) `getTokenOwner()` on chain | Yes | Only if `ENABLE_WEB3=true` |

---

### Flow M3: My NFT Collection

| Step | Actor | Action | On-chain? | Notes |
|------|-------|--------|-----------|-------|
| 1 | User | Open My NFTs | No | GET `/api/nft/my/collection` |
| 2 | Backend | Filter `NFTOwnership` by wallet | No | Matches user's `walletAddress` |

**Breakpoint:** User must have a linked wallet to see their NFTs.

---

### Flow M4: Link Wallet

| Step | Actor | Action | On-chain? | Notes |
|------|-------|--------|-----------|-------|
| 1 | User | Click "Link This Wallet" | No | POST `/api/nft/wallet/link` |
| 2 | Backend | Validate address format, save | No | Stored in `User.walletAddress` |

---

### Flow M5: Secondary Sales (Alchemy Webhook)

| Step | Actor | Action | On-chain? | Notes |
|------|-------|--------|-----------|-------|
| 1 | Alchemy | POST transfer event | Yes | Includes `x-alchemy-signature` header |
| 2 | Backend | Verify HMAC-SHA256 signature | No | `alchemyWebhookMiddleware.js:7-16` |
| 3 | Backend | Reject if signing key missing | No | Returns 500 if `ALCHEMY_SIGNING_KEY` not set |
| 4 | Backend | Parse transfer, create `NFTOwnership` | No | Maps wallet -> user |
| 5 | Backend | Return 200 | No | — |

**Signature verification now properly rejects** requests when `ALCHEMY_SIGNING_KEY` is missing (returns 500 with error message).

---

## Smart Contracts Summary

### KnQNFT.sol
- Standard ERC-721 with ERC-2981 royalty support
- `mint(to, tokenURI, royaltyBps, royaltyReceiver)` — only minter role
- Royalty capped at 30% (3000 bps)
- Uses `_safeMint` — requires receiver to implement `onERC721Received`

### KnQAuctionVault.sol
- `depositBid(auctionId)` — payable, stores escrow per auctionId
- `settleAuction(auctionId, nftContract, tokenId, creator)` — atomic NFT + MATIC swap
- `refundBid(auctionId)` — returns MATIC to winner
- Must receive NFT via `onERC721Received` before settling
- Commission: `creatorPayout = amount - (amount * commissionBps / 10000)`

---

## Flow Status Summary

| Flow | Status | Key Files |
|---|---|---|
| Auction creation (fiat) | Working | `auctionController.js`, `CreateAuctionPage.jsx` |
| Bidding (platform coins) | Working | `auctionController.js:placeBid` |
| Auction end settlement (coins) | Working | `processEndedAuctions()` in `app.js` |
| Prepare IPFS | Working | `ipfsService.js`, `nftController.js:prepareIPFS` |
| Mint NFT to vault | Working | `web3Service.js:mintNFT`, `nftController.js:mintAuctionNFT` |
| Winner claim + deposit MATIC | Working | `ClaimNFTPage.jsx`, vault `depositBid()` |
| Record deposit tx | Working | `nftController.js:recordDeposit` |
| Vault settlement (automated) | **Working** | `app.js:96`, `nftController.js:processVaultSettlements:493-541` |
| MATIC price fetch | **Working** (live CoinGecko) | `publicConfigRoutes.js:14-39`, `ClaimNFTPage.jsx:69-79` |
| Winner wallet linking enforced | **Working** | `ClaimNFTPage.jsx:277-291` |
| Alchemy webhook signature | **Working** (secure) | `alchemyWebhookMiddleware.js:7-16`, `nftRoutes.js:27` |

---

## Remaining Breakpoints

| # | Location | Severity | Issue |
|---|----------|----------|-------|
| 1 | Auction creation | Info | 100% fiat flow, no web3 |
| 2 | Bidding | Info | Platform coins only, no MATIC |
| 3 | Auction settlement | Info | Platform coins only, no NFT minted yet |
| 4 | Vault settlement worker | **LOW** | No batch limit — consider adding `.limit(10)` to prevent overwhelming RPC with too many concurrent transactions |

---

## Recommended Improvements

### Priority 1 (Low)
1. **Add batch limit to settlement worker** — In `processVaultSettlements`, add `.limit(10)` to prevent concurrent settlement of too many auctions at once.

### Priority 2 (Optional)
2. **Settlement tracking** — Store `settlementTxHash` on the auction document after vault settlement completes.
3. **Commission config** — `commissionBps` passed to `settleAuction` should come from `adminConfig`.
4. **Deposit status indicator** — Show a clear indicator in admin UI when auctions are ready for settlement (`nftStatus === 'deposit_received'`).