# 🚀 Simple Crypto & NFT Testing Guide

Welcome! This guide will help you test the cryptocurrency and NFT features of the **KnQ Reels** platform, even if you have zero experience with blockchain.

---

## 🛠️ Step 1: Install a Crypto Wallet
To interact with the blockchain, you need a "wallet." Think of it like a digital bank account for crypto.

1.  **Download MetaMask**: Go to [metamask.io](https://metamask.io/) and install the extension for Chrome or your preferred browser.
2.  **Create a Wallet**: Follow the prompts to set up a new wallet. 
    *   **⚠️ IMPORTANT**: Write down your "Secret Recovery Phrase" and keep it safe. Never share it with anyone.
3.  **Switch to Testnet**: We use a "Testnet" (a playground version of the blockchain) so we don't spend real money.

---

## 🌐 Step 2: Connect to Polygon Amoy Testnet
The project is currently deployed on the **Polygon Amoy Testnet**.

1.  Open MetaMask.
2.  Click the Network dropdown (usually says "Ethereum Mainnet" at the top).
3.  Click **Add Network** -> **Add a network manually**.
4.  Enter these details:
    *   **Network Name**: Polygon Amoy Testnet
    *   **New RPC URL**: `https://rpc-amoy.polygon.technology`
    *   **Chain ID**: `80002`
    *   **Currency Symbol**: `MATIC`
    *   **Block Explorer URL**: `https://amoy.polygonscan.com`
5.  Click **Save** and switch to this network.

---

## 💰 Step 3: Get Free "Test MATIC"
Since this is a testnet, you can get free "fake" money to test the platform.

1.  Copy your wallet address from MetaMask (starts with `0x...`).
2.  Go to a faucet: [Polygon Faucet](https://faucet.polygon.technology/) or [Amoy Faucet](https://faucet.circle.com/).
3.  Paste your address and click **Submit**.
4.  Wait ~30 seconds. You should see about 0.5 - 1.0 MATIC in your MetaMask.

---

## 🧪 Step 4: Testing the App

### 1. Connect Your Wallet
*   Run the frontend (`npm run dev` in the `frontend` folder).
*   Look for a **"Connect Wallet"** button (usually in the header or Profile page).
*   MetaMask will pop up asking for permission. Click **Connect**.

### 2. Marketplace & NFTs
*   Go to the **NFT Marketplace** page.
*   You should see listed NFTs.
*   Try to **Buy** or **Bid** on an NFT. MetaMask will ask you to "Confirm" the transaction. This will spend your free Test MATIC.

---

## 🔄 Step 5: The NFT Lifecycle (How to Test Minting)
In this platform, NFTs are usually created from completed auctions. Here is how you can test the full flow:

1.  **Create an Auction**:
    *   Go to the app and create a "Reel" or "Post" and mark it for Auction (if available).
    *   Alternatively, use the **Create NFT/Auction** page.
2.  **Bidding**:
    *   Switch to a *different* MetaMask account (you can create multiple in MetaMask).
    *   Get some Test MATIC for this new account.
    *   Place a bid on the auction.
3.  **End the Auction**:
    *   Wait for the auction time to expire.
4.  **Admin Minting (The "Crypto" Part)**:
    *   The platform doesn't mint the NFT automatically to save gas. An **Admin** must trigger it.
    *   Go to the **Admin Panel** -> **NFT Moderation**.
    *   Find the completed auction and click **Mint NFT**.
    *   The backend will use its own "Minter Wallet" to send the NFT to the winner.
5.  **Verify**:
    *   Once minted, the winner can see the NFT in their **Collection**.
    *   It will also appear in the **Marketplace**.

---

## 🔎 How to Verify Transactions?
Every time you do something (Buy, Bid, Mint), a transaction is recorded on the blockchain.

1.  When MetaMask shows "Transaction Confirmed," click the link to view it on the **Block Explorer**.
2.  Or go to [amoy.polygonscan.com](https://amoy.polygonscan.com/) and paste your wallet address to see everything you've done.

---

## 📝 Developer Notes (For Reference)
*   **NFT Contract**: `0xef0C28f95026D5d7c98B0F3fCB93Dae37eA2eb9b`
*   **Auction Vault**: `0x5ced8f4CB393A07dfCf5E859852EDf6F704Df2E9`
*   **Network**: Polygon Amoy (Chain ID: 80002)

If you get stuck or see an error like "Insufficient Funds," make sure you have MATIC from the faucet!
