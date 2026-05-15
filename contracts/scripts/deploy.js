const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "MATIC");

  // ── Deploy KnQNFT ─────────────────────────────────────────────────────────
  // The minter is our backend server wallet (set in .env as MINTER_WALLET_ADDRESS)
  const minterAddress = process.env.MINTER_WALLET_ADDRESS || deployer.address;
  console.log("\nDeploying KnQNFT...");
  console.log("Minter address:", minterAddress);

  const KnQNFT = await ethers.getContractFactory("KnQNFT");
  const nft = await KnQNFT.deploy(minterAddress);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ KnQNFT deployed to:", nftAddress);

  // ── Deploy KnQAuctionVault ────────────────────────────────────────────────
  // Treasury = platform wallet that receives commission
  const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS || deployer.address;
  // Commission in basis points (1000 = 10%)
  const commissionBps = Number(process.env.PLATFORM_COMMISSION_BPS || 1000);

  console.log("\nDeploying KnQAuctionVault...");
  console.log("Treasury:", treasuryAddress);
  console.log("Commission:", commissionBps, "bps =", commissionBps / 100, "%");

  const KnQAuctionVault = await ethers.getContractFactory("KnQAuctionVault");
  const vault = await KnQAuctionVault.deploy(treasuryAddress, commissionBps);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ KnQAuctionVault deployed to:", vaultAddress);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("DEPLOYMENT COMPLETE — Add these to your backend/.env:");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`NFT_CONTRACT_ADDRESS=${nftAddress}`);
  console.log(`VAULT_CONTRACT_ADDRESS=${vaultAddress}`);
  console.log(`MINTER_WALLET_ADDRESS=${minterAddress}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // ── Save to deployments.json ──────────────────────────────────────────────
  const fs = require("fs");
  const network = (await ethers.provider.getNetwork()).name;
  const deployments = {
    network,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    contracts: {
      KnQNFT: {
        address: nftAddress,
        minter: minterAddress
      },
      KnQAuctionVault: {
        address: vaultAddress,
        treasury: treasuryAddress,
        commissionBps
      }
    }
  };

  fs.writeFileSync("deployments.json", JSON.stringify(deployments, null, 2));
  console.log("📄 Deployment info saved to deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
