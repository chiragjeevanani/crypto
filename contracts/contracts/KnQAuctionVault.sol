// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title KnQAuctionVault
 * @notice Escrow contract for KnQ Reels NFT auctions.
 *         The auction winner deposits MATIC into this vault.
 *         Admin settles the auction — transferring MATIC to creator
 *         minus platform commission, and transferring the NFT to the winner.
 *
 * @dev Bidding remains off-chain (MongoDB). This contract only handles
 *      the final atomic settlement: MATIC → Creator, NFT → Winner.
 */
contract KnQAuctionVault is Ownable, ReentrancyGuard {
    // ─── Types ───────────────────────────────────────────────────────────────

    struct EscrowDeposit {
        address winner;         // Winning bidder's wallet
        uint256 amount;         // MATIC deposited (in wei)
        bool settled;           // True after auction is settled
        bool refunded;          // True after refund issued
    }

    // ─── State ───────────────────────────────────────────────────────────────

    /// @notice maps off-chain auctionId (string) → escrow deposit
    mapping(string => EscrowDeposit) public deposits;

    /// @notice Platform treasury wallet (receives commission)
    address public treasury;

    /// @notice Platform commission in basis points (e.g. 1000 = 10%)
    uint96 public commissionBps;

    // ─── Events ──────────────────────────────────────────────────────────────

    event DepositPlaced(string indexed auctionId, address indexed winner, uint256 amount);
    event AuctionSettled(
        string indexed auctionId,
        address indexed winner,
        address indexed creator,
        uint256 creatorPayout,
        uint256 commission,
        uint256 tokenId
    );
    event BidRefunded(string indexed auctionId, address indexed winner, uint256 amount);
    event TreasuryUpdated(address newTreasury);
    event CommissionUpdated(uint96 newBps);

    // ─── Errors ──────────────────────────────────────────────────────────────

    error AlreadyDeposited();
    error NoDeposit();
    error AlreadySettled();
    error AlreadyRefunded();
    error WrongSender();
    error ZeroAddress();
    error TransferFailed();
    error InsufficientDeposit();

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _treasury, uint96 _commissionBps) Ownable(msg.sender) {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        commissionBps = _commissionBps;
    }

    // ─── Winner: Deposit MATIC ────────────────────────────────────────────────

    /**
     * @notice Winner calls this to escrow their MATIC payment.
     * @param auctionId  Off-chain MongoDB auction ID (string)
     *
     * @dev msg.value must equal the winning bid amount.
     *      Only callable once per auction — prevents double deposits.
     */
    function depositBid(string calldata auctionId) external payable nonReentrant {
        if (msg.value == 0) revert InsufficientDeposit();

        EscrowDeposit storage d = deposits[auctionId];
        if (d.winner != address(0)) revert AlreadyDeposited();

        deposits[auctionId] = EscrowDeposit({
            winner: msg.sender,
            amount: msg.value,
            settled: false,
            refunded: false
        });

        emit DepositPlaced(auctionId, msg.sender, msg.value);
    }

    // ─── Admin: Settle Auction ────────────────────────────────────────────────

    /**
     * @notice Admin calls this to settle a completed auction.
     *         Transfers the NFT to winner and MATIC to creator (minus commission).
     *
     * @param auctionId      Off-chain MongoDB auction ID
     * @param nftContract    Address of KnQNFT contract
     * @param tokenId        Token ID of the minted NFT
     * @param creator        Creator's wallet address (receives payout)
     */
    function settleAuction(
        string calldata auctionId,
        address nftContract,
        uint256 tokenId,
        address payable creator
    ) external onlyOwner nonReentrant {
        if (nftContract == address(0) || creator == address(0)) revert ZeroAddress();

        EscrowDeposit storage d = deposits[auctionId];
        if (d.winner == address(0)) revert NoDeposit();
        if (d.settled) revert AlreadySettled();
        if (d.refunded) revert AlreadyRefunded();

        d.settled = true;

        // Calculate commission and creator payout
        uint256 commission = (d.amount * commissionBps) / 10000;
        uint256 creatorPayout = d.amount - commission;

        // Transfer NFT from vault (vault must hold or be approved for the token)
        IERC721(nftContract).safeTransferFrom(address(this), d.winner, tokenId);

        // Pay creator
        (bool sentCreator,) = creator.call{value: creatorPayout}("");
        if (!sentCreator) revert TransferFailed();

        // Pay treasury (platform commission)
        if (commission > 0) {
            (bool sentTreasury,) = payable(treasury).call{value: commission}("");
            if (!sentTreasury) revert TransferFailed();
        }

        emit AuctionSettled(auctionId, d.winner, creator, creatorPayout, commission, tokenId);
    }

    // ─── Admin: Refund ───────────────────────────────────────────────────────

    /**
     * @notice Refund the winner if auction is cancelled or NFT mint fails.
     * @param auctionId  Off-chain MongoDB auction ID
     */
    function refundBid(string calldata auctionId) external onlyOwner nonReentrant {
        EscrowDeposit storage d = deposits[auctionId];
        if (d.winner == address(0)) revert NoDeposit();
        if (d.settled) revert AlreadySettled();
        if (d.refunded) revert AlreadyRefunded();

        d.refunded = true;
        uint256 refundAmount = d.amount;

        (bool sent,) = payable(d.winner).call{value: refundAmount}("");
        if (!sent) revert TransferFailed();

        emit BidRefunded(auctionId, d.winner, refundAmount);
    }

    // ─── Admin: Config ───────────────────────────────────────────────────────

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setCommission(uint96 _bps) external onlyOwner {
        require(_bps <= 3000, "Max 30%");
        commissionBps = _bps;
        emit CommissionUpdated(_bps);
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function getDeposit(string calldata auctionId) external view returns (EscrowDeposit memory) {
        return deposits[auctionId];
    }

    /// @notice Allow contract to receive NFT via safeTransferFrom
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
