// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract KokoroToken is ERC20, Ownable {
    constructor () ERC20("KokoroToken", "KOK") {
        // Mint 1 billion tokens to the contract itself
        _mint(address(this), 1_000_000_000 * 10**decimals());
    }

    function buyTokens() external payable {
        require(msg.value > 0, "Must send AVAX to buy tokens");
        uint256 amount = msg.value * 1000; // Example: 1 AVAX = 1000 KOK
        _transfer(address(this), msg.sender, amount);
    }
}

contract Shi is ERC1155, Ownable {
    uint256 public currentTokenId;

    constructor() ERC1155("https://example.com/metadata/{id}.json") {}

    function mint(address to, uint256 amount, bytes memory data) external onlyOwner returns (uint256) {
        uint256 tokenId = currentTokenId;
        _mint(to, tokenId, amount, data);
        currentTokenId += 1;
        return tokenId;
    }
}

contract Sasageyo is Ownable (address initialOwner) {
    KokoroToken public kokoroToken;
    Shi public shiNFT;

    uint256 public totalSacrificed; // Tracks total Kokoro tokens burned
    uint256 public initialPrice = 1 ether; // Base price for the bonding curve
    uint256 public bondingCoefficient = 2; // Exponential growth factor
    uint256 public nftFraction = 10; // Fraction for minting Shi NFTs (e.g., 10 = 10%)

    struct Proof {
        address user;
        string finalWords;
        uint256 timestamp;
    }

    Proof[] public proofs;

    event Harikari(address indexed user, uint256 kokoroBurned, uint256 nftMinted, string finalWords, uint256 tokenId);
    event MassSeppuku(uint256 totalSacrificed);

    constructor(address kokoroAddress, address shiAddress) {
        kokoroToken = KokoroToken(kokoroAddress);
        shiNFT = Shi(shiAddress);
    }

    function calculateHarikariCost() public view returns (uint256) {
        // Bonding curve: Cost = initialPrice * (1 + (totalSacrificed ^ bondingCoefficient) / totalSupply)
        uint256 totalSupply = kokoroToken.totalSupply();
        return initialPrice + (totalSacrificed**bondingCoefficient / totalSupply);
    }

    function harikari(string calldata finalWords) external {
        uint256 cost = calculateHarikariCost();
        require(kokoroToken.balanceOf(msg.sender) >= cost, "Insufficient tokens for Harikari");

        // Burn Kokoro tokens
        kokoroToken.transferFrom(msg.sender, address(0), cost);
        totalSacrificed += cost;

        // Mint 死 NFT
        uint256 nftAmount = cost / nftFraction; // Fraction of burned Kokoro to mint as 死 NFT
        require(nftAmount > 0, "Burned amount too low for NFT");
        uint256 tokenId = shiNFT.mint(msg.sender, nftAmount, "");

        // Save Proof
        proofs.push(Proof({
            user: msg.sender,
            finalWords: finalWords,
            timestamp: block.timestamp
        }));

        emit Harikari(msg.sender, cost, nftAmount, finalWords, tokenId);
    }

    function massSeppuku() external onlyOwner {
        uint256 totalSupply = kokoroToken.totalSupply();
        uint256 totalBurned = kokoroToken.balanceOf(address(0));

        require(totalBurned >= (totalSupply * 50) / 100, "Mass Seppuku requires 50% token burn");
        emit MassSeppuku(totalBurned);
    }

    function getProofs() external view returns (Proof[] memory) {
        return proofs;
    }
}
