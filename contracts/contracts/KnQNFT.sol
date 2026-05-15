// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KnQNFT
 * @notice ERC-721 NFT contract for KnQ Reels platform.
 *         Mints a unique token for each auction winner.
 *         Supports ERC-2981 royalties — creators earn % on every resale
 *         on OpenSea, Blur, Rarible, and any compatible marketplace.
 *
 * @dev Only the designated `minter` address (our backend server wallet)
 *      can call `mint()`. The owner (admin wallet) can update the minter.
 */
contract KnQNFT is ERC721URIStorage, ERC2981, Ownable {
    // ─── State ───────────────────────────────────────────────────────────────

    /// @notice Address authorized to mint new tokens (backend server wallet)
    address public minter;

    /// @notice Auto-incrementing token counter
    uint256 private _tokenIdCounter;

    /// @notice Platform name stored in contract for discoverability
    string public constant PLATFORM = "KnQ Reels";

    // ─── Events ──────────────────────────────────────────────────────────────

    event Minted(
        uint256 indexed tokenId,
        address indexed to,
        string tokenURI,
        address royaltyReceiver,
        uint96 royaltyBps
    );

    event MinterUpdated(address indexed oldMinter, address indexed newMinter);

    // ─── Errors ──────────────────────────────────────────────────────────────

    error NotMinter();
    error ZeroAddress();
    error EmptyTokenURI();

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _minter) ERC721("KnQ Reels NFT", "KNQNFT") Ownable(msg.sender) {
        if (_minter == address(0)) revert ZeroAddress();
        minter = _minter;
    }

    // ─── Modifiers ───────────────────────────────────────────────────────────

    modifier onlyMinter() {
        if (msg.sender != minter) revert NotMinter();
        _;
    }

    // ─── Core Functions ──────────────────────────────────────────────────────

    /**
     * @notice Mint a new NFT to an auction winner.
     * @param to              Winner's wallet address
     * @param tokenURI_       IPFS URI: ipfs://Qm...  (OpenSea-compatible metadata)
     * @param royaltyBps      Royalty in basis points (e.g. 1000 = 10%)
     * @param royaltyReceiver Creator's wallet address (receives royalty on resales)
     * @return tokenId        The newly minted token ID
     *
     * @dev Only callable by the `minter` address (our backend server).
     *      tokenURI must point to IPFS — not a centralized server.
     */
    function mint(
        address to,
        string calldata tokenURI_,
        uint96 royaltyBps,
        address royaltyReceiver
    ) external onlyMinter returns (uint256 tokenId) {
        if (to == address(0)) revert ZeroAddress();
        if (bytes(tokenURI_).length == 0) revert EmptyTokenURI();
        if (royaltyReceiver == address(0)) revert ZeroAddress();

        // Clamp royalty to max 30% (3000 bps)
        uint96 clampedBps = royaltyBps > 3000 ? 3000 : royaltyBps;

        _tokenIdCounter++;
        tokenId = _tokenIdCounter;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        _setTokenRoyalty(tokenId, royaltyReceiver, clampedBps);

        emit Minted(tokenId, to, tokenURI_, royaltyReceiver, clampedBps);
    }

    // ─── Admin Functions ─────────────────────────────────────────────────────

    /**
     * @notice Update the minter address (e.g. when rotating server wallet).
     * @param _newMinter New minter address
     */
    function setMinter(address _newMinter) external onlyOwner {
        if (_newMinter == address(0)) revert ZeroAddress();
        emit MinterUpdated(minter, _newMinter);
        minter = _newMinter;
    }

    // ─── View Functions ──────────────────────────────────────────────────────

    /// @notice Returns the total number of NFTs minted so far
    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // ─── Interface Support ───────────────────────────────────────────────────

    /**
     * @dev Required override: ERC721URIStorage + ERC2981 both implement supportsInterface.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
