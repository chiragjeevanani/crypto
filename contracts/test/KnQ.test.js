const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KnQNFT", function () {
  let nft, owner, minter, user, creator;

  beforeEach(async () => {
    [owner, minter, user, creator] = await ethers.getSigners();
    const KnQNFT = await ethers.getContractFactory("KnQNFT");
    nft = await KnQNFT.deploy(minter.address);
    await nft.waitForDeployment();
  });

  it("sets correct minter on deploy", async () => {
    expect(await nft.minter()).to.equal(minter.address);
  });

  it("allows minter to mint an NFT", async () => {
    const tx = await nft.connect(minter).mint(
      user.address,
      "ipfs://QmTestMetadata",
      1000, // 10% royalty
      creator.address
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(l => l.fragment?.name === "Minted");
    expect(event).to.not.be.undefined;
    expect(await nft.ownerOf(1)).to.equal(user.address);
    expect(await nft.tokenURI(1)).to.equal("ipfs://QmTestMetadata");
  });

  it("blocks non-minter from minting", async () => {
    await expect(
      nft.connect(user).mint(user.address, "ipfs://Qm", 1000, creator.address)
    ).to.be.revertedWithCustomError(nft, "NotMinter");
  });

  it("clamps royalty to 30%", async () => {
    await nft.connect(minter).mint(user.address, "ipfs://Qm", 5000, creator.address);
    const [, bps] = await nft.royaltyInfo(1, ethers.parseEther("1"));
    // 3000 bps of 1 MATIC = 0.30 MATIC
    expect(bps).to.equal(ethers.parseEther("0.30"));
  });

  it("increments token counter", async () => {
    await nft.connect(minter).mint(user.address, "ipfs://Qm1", 500, creator.address);
    await nft.connect(minter).mint(user.address, "ipfs://Qm2", 500, creator.address);
    expect(await nft.totalMinted()).to.equal(2n);
  });

  it("allows owner to update minter", async () => {
    await nft.connect(owner).setMinter(user.address);
    expect(await nft.minter()).to.equal(user.address);
  });

  it("rejects zero address as minter", async () => {
    await expect(
      nft.connect(owner).setMinter(ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(nft, "ZeroAddress");
  });
});

describe("KnQAuctionVault", function () {
  let vault, nft, owner, winner, creator, minter;
  const COMMISSION_BPS = 1000; // 10%
  const BID_AMOUNT = ethers.parseEther("1.0"); // 1 MATIC

  beforeEach(async () => {
    [owner, winner, creator, minter] = await ethers.getSigners();

    // Deploy NFT contract
    const KnQNFT = await ethers.getContractFactory("KnQNFT");
    nft = await KnQNFT.deploy(minter.address);
    await nft.waitForDeployment();

    // Deploy vault
    const KnQAuctionVault = await ethers.getContractFactory("KnQAuctionVault");
    vault = await KnQAuctionVault.deploy(owner.address, COMMISSION_BPS);
    await vault.waitForDeployment();
  });

  it("accepts deposit from winner", async () => {
    await vault.connect(winner).depositBid("auction_001", { value: BID_AMOUNT });
    const deposit = await vault.getDeposit("auction_001");
    expect(deposit.winner).to.equal(winner.address);
    expect(deposit.amount).to.equal(BID_AMOUNT);
    expect(deposit.settled).to.be.false;
  });

  it("prevents double deposit", async () => {
    await vault.connect(winner).depositBid("auction_002", { value: BID_AMOUNT });
    await expect(
      vault.connect(winner).depositBid("auction_002", { value: BID_AMOUNT })
    ).to.be.revertedWithCustomError(vault, "AlreadyDeposited");
  });

  it("settles auction: sends MATIC to creator and commission to treasury", async () => {
    await vault.connect(winner).depositBid("auction_003", { value: BID_AMOUNT });

    // Mint NFT to vault so it can transfer
    await nft.connect(minter).mint(await vault.getAddress(), "ipfs://Qm", 1000, creator.address);

    const creatorBalBefore = await ethers.provider.getBalance(creator.address);
    const treasuryBalBefore = await ethers.provider.getBalance(owner.address);

    await vault.connect(owner).settleAuction(
      "auction_003",
      await nft.getAddress(),
      1,
      creator.address
    );

    const creatorBalAfter = await ethers.provider.getBalance(creator.address);
    const treasuryBalAfter = await ethers.provider.getBalance(owner.address);

    // Creator gets 90% (0.9 MATIC)
    expect(creatorBalAfter - creatorBalBefore).to.be.closeTo(
      ethers.parseEther("0.9"),
      ethers.parseEther("0.01") // allow for gas
    );

    // Winner owns the NFT
    expect(await nft.ownerOf(1)).to.equal(winner.address);
  });

  it("refunds winner when admin calls refund", async () => {
    await vault.connect(winner).depositBid("auction_004", { value: BID_AMOUNT });

    const winnerBalBefore = await ethers.provider.getBalance(winner.address);
    await vault.connect(owner).refundBid("auction_004");
    const winnerBalAfter = await ethers.provider.getBalance(winner.address);

    expect(winnerBalAfter - winnerBalBefore).to.be.closeTo(
      BID_AMOUNT,
      ethers.parseEther("0.01")
    );

    const deposit = await vault.getDeposit("auction_004");
    expect(deposit.refunded).to.be.true;
  });

  it("prevents settling already-settled auction", async () => {
    await vault.connect(winner).depositBid("auction_005", { value: BID_AMOUNT });
    await nft.connect(minter).mint(await vault.getAddress(), "ipfs://Qm", 1000, creator.address);
    await vault.connect(owner).settleAuction("auction_005", await nft.getAddress(), 1, creator.address);

    await expect(
      vault.connect(owner).settleAuction("auction_005", await nft.getAddress(), 1, creator.address)
    ).to.be.revertedWithCustomError(vault, "AlreadySettled");
  });
});
