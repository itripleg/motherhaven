// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    constructor(
        address initialOwner,
        string memory name,
        string memory ticker,
        uint initialMint
    ) ERC20(name, ticker) Ownable(initialOwner) {
        _mint(msg.sender, initialMint);
    }
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

contract Kokoro is ERC20, Ownable {
    constructor(
        address initialOwner,
        string memory name,
        string memory ticker,
        uint initialMint
    ) ERC20(name, ticker) Ownable(initialOwner) {
        _mint(msg.sender, initialMint);
    }

    Kokoro public kokoro;
    // Shi public shiNFT;

    uint256 public totalSacrificed; // Tracks total Kokoro tokens burned
    uint256 public initialPrice = 1 ether; // Base price for the bonding curve
    uint256 public bondingCoefficient = 2; // Exponential growth factor
    uint256 public nftFraction = 10; // Fraction for minting Shi NFTs (e.g., 10 = 10%)

    struct Proof {
        address user;
        string finalWords;
        uint256 timestamp;
    }
}
