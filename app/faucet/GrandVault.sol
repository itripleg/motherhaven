// contracts/GrandVault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GrandVault
 * @dev A vault that collects trading fees and provides faucet functionality for whitelisted addresses
 * Simple, focused design for fee collection and distribution
 */
contract GrandVault is Ownable, ReentrancyGuard {
    // Constants
    uint256 public constant BLOCK_TIME = 2; // 2 seconds per block on Avalanche
    uint256 public constant BLOCKS_PER_DAY = 43200; // 24 * 60 * 60 / 2

    // State variables
    uint256 public dripAmount = 0.01 ether; // Default 0.01 AVAX per drip
    uint256 public dripInterval = BLOCKS_PER_DAY; // 1 day interval

    // Whitelist and drip tracking
    mapping(address => bool) public whitelisted;
    mapping(address => uint256) public lastDripBlock;

    // Fee collection tracking
    mapping(address => uint256) public totalFeesCollected; // Track fees per DEX/source
    uint256 public totalVaultBalance;

    // Events
    event Drip(address indexed recipient, uint256 amount);
    event DripAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event DripIntervalUpdated(uint256 oldInterval, uint256 newInterval);
    event FundsReceived(address indexed sender, uint256 amount);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event WhitelistUpdated(address indexed account, bool status);
    event FeesCollected(address indexed source, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {
        // Initial setup complete
    }

    // Receive function to accept AVAX deposits
    receive() external payable {
        totalVaultBalance += msg.value;
        emit FundsReceived(msg.sender, msg.value);
    }

    /**
     * @dev Collect trading fees from DEX or other sources
     * @param source The address/contract that generated the fees
     */
    function collectFees(address source) external payable {
        require(msg.value > 0, "No fees to collect");
        totalFeesCollected[source] += msg.value;
        totalVaultBalance += msg.value;
        emit FeesCollected(source, msg.value);
    }

    /**
     * @dev Standard faucet drip for whitelisted addresses
     */
    function requestDrip() external nonReentrant {
        require(whitelisted[msg.sender], "Address not whitelisted");
        require(canRequestDrip(msg.sender), "Drip interval not met");
        require(
            address(this).balance >= dripAmount,
            "Insufficient vault balance"
        );

        lastDripBlock[msg.sender] = block.number;
        totalVaultBalance -= dripAmount;

        payable(msg.sender).transfer(dripAmount);
        emit Drip(msg.sender, dripAmount);
    }

    /**
     * @dev Check if address can request a drip
     */
    function canRequestDrip(address account) public view returns (bool) {
        if (!whitelisted[account]) return false;
        return block.number >= lastDripBlock[account] + dripInterval;
    }

    /**
     * @dev Get next available drip block for an account
     */
    function getNextDripBlock(address account) external view returns (uint256) {
        return lastDripBlock[account] + dripInterval;
    }

    // Admin functions
    function updateWhitelist(address account, bool status) external onlyOwner {
        whitelisted[account] = status;
        emit WhitelistUpdated(account, status);
    }

    function batchUpdateWhitelist(
        address[] calldata accounts,
        bool status
    ) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            whitelisted[accounts[i]] = status;
            emit WhitelistUpdated(accounts[i], status);
        }
    }

    function setDripAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > 0, "Amount must be greater than 0");
        uint256 oldAmount = dripAmount;
        dripAmount = newAmount;
        emit DripAmountUpdated(oldAmount, newAmount);
    }

    function setDripInterval(uint256 newInterval) external onlyOwner {
        require(newInterval > 0, "Interval must be greater than 0");
        uint256 oldInterval = dripInterval;
        dripInterval = newInterval;
        emit DripIntervalUpdated(oldInterval, newInterval);
    }

    /**
     * @dev Withdraw specific amount (owner only)
     */
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "Insufficient balance");
        totalVaultBalance -= amount;
        payable(owner()).transfer(amount);
        emit FundsWithdrawn(owner(), amount);
    }

    /**
     * @dev Withdraw all funds (owner only)
     */
    function withdrawAll() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        totalVaultBalance = 0;
        payable(owner()).transfer(balance);
        emit FundsWithdrawn(owner(), balance);
    }

    // View functions
    function getVaultInfo()
        external
        view
        returns (
            uint256 currentBalance,
            uint256 trackedBalance,
            uint256 currentDripAmount,
            uint256 currentInterval
        )
    {
        return (
            address(this).balance,
            totalVaultBalance,
            dripAmount,
            dripInterval
        );
    }

    function getUserInfo(
        address user
    )
        external
        view
        returns (
            bool isWhitelisted,
            bool canDrip,
            uint256 nextDripBlock,
            uint256 lastDrip
        )
    {
        return (
            whitelisted[user],
            canRequestDrip(user),
            lastDripBlock[user] + dripInterval,
            lastDripBlock[user]
        );
    }

    function getFeesCollected(address source) external view returns (uint256) {
        return totalFeesCollected[source];
    }

    /**
     * @dev Get total fees collected across all sources
     */
    function getTotalFeesCollected() external view returns (uint256) {
        return totalVaultBalance;
    }
}
