// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IBurnManager {
    function notifyBurn(address burner, uint256 amount) external;
    function supportsToken(address token) external view returns (bool);
}

/**
 * @title SimplePetBurnManager
 * @dev A simplified burn manager that manages a community pet with ownership transfer on revival
 */
contract SimplePetBurnManager is IBurnManager, Ownable, ReentrancyGuard {
    // Events
    event PetFed(
        address indexed feeder,
        uint256 amount,
        uint256 healthGained,
        uint256 newHealth,
        uint256 timestamp
    );
    event PetDied(uint256 timestamp, string message, uint256 deathCount);
    event PetRevived(
        address indexed reviver,
        address indexed newOwner,
        uint256 revivalCost,
        uint256 timestamp,
        uint256 deathCount
    );
    event PetRenamed(
        address indexed owner,
        string oldName,
        string newName,
        uint256 timestamp
    );
    event TokenSupported(address indexed token, bool supported);
    event FeedingRateUpdated(uint256 oldRate, uint256 newRate);
    event PetCaretakerChanged(
        address indexed previousCaretaker,
        address indexed newCaretaker
    );

    // Pet struct
    struct Pet {
        string name;
        uint256 health; // 0-100
        uint256 lastFed;
        bool isAlive;
        uint256 totalFeedings;
        uint256 deathCount; // Track how many times pet has died
        address currentCaretaker; // Current owner/caretaker of the pet
    }

    // State variables
    Pet public pet;
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public userFeedingCount;

    // Constants
    uint256 public constant MAX_HEALTH = 100;
    uint256 public constant DECAY_RATE = 1; // Health decays by 1 per hour
    uint256 public constant DEATH_THRESHOLD = 0;

    // Feeding mechanics - 1000 tokens = 10 health (can be adjusted by owner)
    uint256 public tokensPerHealthPoint = 100 * 1e18; // 100 tokens (18 decimals) = 1 health point
    uint256 public constant MIN_HEALTH_GAIN = 1; // Minimum 1 health per feeding
    uint256 public constant MAX_HEALTH_GAIN = 50; // Maximum 50 health per feeding to prevent abuse

    // Revival economics - doubles each time
    uint256 public baseRevivalCost = 0.1 ether; // Base cost starts at 0.1 AVAX
    uint256 public constant MAX_REVIVAL_COST = 50 ether; // Cap at 50 AVAX to prevent it getting too crazy

    constructor(address[] memory _initialSupportedTokens) Ownable(msg.sender) {
        pet = Pet({
            name: "Testy",
            health: 50,
            lastFed: block.timestamp,
            isAlive: true,
            totalFeedings: 0,
            deathCount: 0,
            currentCaretaker: msg.sender
        });

        // Set initial supported tokens if provided
        for (uint256 i = 0; i < _initialSupportedTokens.length; i++) {
            if (_initialSupportedTokens[i] != address(0)) {
                supportedTokens[_initialSupportedTokens[i]] = true;
                emit TokenSupported(_initialSupportedTokens[i], true);
            }
        }
    }

    modifier validToken(address token) {
        require(supportedTokens[token], "Token not supported");
        _;
    }

    modifier petAlive() {
        require(pet.isAlive, "Pet is dead");
        _;
    }

    modifier onlyCaretaker() {
        require(
            msg.sender == pet.currentCaretaker,
            "Only current caretaker can perform this action"
        );
        _;
    }

    // IBurnManager implementation with scaled health
    function notifyBurn(
        address burner,
        uint256 amount
    ) external override validToken(msg.sender) {
        require(amount > 0, "Cannot burn zero tokens");

        _updatePetHealth();

        if (!pet.isAlive) {
            revert("Pet is dead - revive first!");
        }

        // Calculate health gain based on burned amount
        uint256 healthGain = _calculateHealthGain(amount);

        // Apply health gain with max cap
        if (pet.health + healthGain > MAX_HEALTH) {
            pet.health = MAX_HEALTH;
        } else {
            pet.health += healthGain;
        }

        pet.lastFed = block.timestamp;
        pet.totalFeedings++;
        userFeedingCount[burner]++;

        emit PetFed(burner, amount, healthGain, pet.health, block.timestamp);
    }

    /**
     * @dev Calculate health gain based on burned token amount
     * @param amount Amount of tokens burned (with decimals)
     * @return healthGain Amount of health points to add
     */
    function _calculateHealthGain(
        uint256 amount
    ) internal view returns (uint256) {
        // Calculate base health gain: amount / tokensPerHealthPoint
        uint256 healthGain = amount / tokensPerHealthPoint;

        // Ensure minimum health gain
        if (healthGain < MIN_HEALTH_GAIN) {
            healthGain = MIN_HEALTH_GAIN;
        }

        // Cap maximum health gain to prevent abuse
        if (healthGain > MAX_HEALTH_GAIN) {
            healthGain = MAX_HEALTH_GAIN;
        }

        return healthGain;
    }

    /**
     * @dev Preview how much health would be gained from burning a specific amount
     * @param amount Amount of tokens to burn
     * @return healthGain Amount of health points that would be gained
     */
    function previewHealthGain(uint256 amount) external view returns (uint256) {
        return _calculateHealthGain(amount);
    }

    function supportsToken(
        address token
    ) external view override returns (bool) {
        return supportedTokens[token];
    }

    // Update pet health based on time decay
    function _updatePetHealth() internal {
        if (!pet.isAlive) return;

        uint256 timeSinceLastFed = block.timestamp - pet.lastFed;
        uint256 hoursPassed = timeSinceLastFed / 3600;

        if (hoursPassed > 0) {
            uint256 healthDecay = hoursPassed * DECAY_RATE;

            if (pet.health <= healthDecay) {
                pet.health = 0;
                pet.isAlive = false;
                pet.deathCount++;
                emit PetDied(
                    block.timestamp,
                    "Pet died from neglect",
                    pet.deathCount
                );
            } else {
                pet.health -= healthDecay;
            }
        }
    }

    /**
     * @dev Calculate current revival cost based on death count
     * @return cost Current cost to revive the pet in wei
     */
    function getCurrentRevivalCost() public view returns (uint256) {
        if (pet.isAlive) return 0;

        // Double the cost for each death: baseRevivalCost * (2 ^ deathCount)
        // But cap it at MAX_REVIVAL_COST
        uint256 cost = baseRevivalCost;

        for (uint256 i = 0; i < pet.deathCount; i++) {
            cost = cost * 2;
            if (cost > MAX_REVIVAL_COST) {
                return MAX_REVIVAL_COST;
            }
        }

        return cost;
    }

    /**
     * @dev Revive the pet - caller becomes new owner/caretaker
     */
    function revivePet() external payable nonReentrant {
        require(!pet.isAlive, "Pet is already alive");

        uint256 requiredCost = getCurrentRevivalCost();
        require(msg.value >= requiredCost, "Insufficient payment");

        // Transfer ownership to reviver
        address previousCaretaker = pet.currentCaretaker;
        pet.currentCaretaker = msg.sender;

        // Revive pet
        pet.isAlive = true;
        pet.health = 50;
        pet.lastFed = block.timestamp;

        // Send payment to previous caretaker (or contract owner if no previous caretaker)
        address paymentRecipient = previousCaretaker != address(0)
            ? previousCaretaker
            : owner();
        payable(paymentRecipient).transfer(msg.value);

        emit PetRevived(
            msg.sender,
            msg.sender,
            requiredCost,
            block.timestamp,
            pet.deathCount
        );
        emit PetCaretakerChanged(previousCaretaker, msg.sender);
    }

    /**
     * @dev Rename the pet (only current caretaker can do this)
     * @param newName New name for the pet
     */
    function renamePet(string memory newName) external onlyCaretaker {
        require(bytes(newName).length > 0, "Name cannot be empty");
        require(bytes(newName).length <= 32, "Name too long");

        string memory oldName = pet.name;
        pet.name = newName;

        emit PetRenamed(msg.sender, oldName, newName, block.timestamp);
    }

    /**
     * @dev Get information about revival economics
     * @return currentCost Current cost to revive (0 if alive)
     * @return nextCost Cost if pet dies again
     * @return deathCount Number of times pet has died
     * @return maxCost Maximum possible revival cost
     */
    function getRevivalInfo()
        external
        view
        returns (
            uint256 currentCost,
            uint256 nextCost,
            uint256 deathCount,
            uint256 maxCost
        )
    {
        currentCost = getCurrentRevivalCost();

        // Calculate next death cost
        nextCost = baseRevivalCost;
        for (uint256 i = 0; i <= pet.deathCount; i++) {
            nextCost = nextCost * 2;
            if (nextCost > MAX_REVIVAL_COST) {
                nextCost = MAX_REVIVAL_COST;
                break;
            }
        }

        return (currentCost, nextCost, pet.deathCount, MAX_REVIVAL_COST);
    }

    // Owner functions (now caretaker functions)
    function setSupportedToken(
        address token,
        bool supported
    ) external onlyOwner {
        // Keep as contract owner only
        supportedTokens[token] = supported;
        emit TokenSupported(token, supported);
    }

    /**
     * @dev Update base revival cost (contract owner only)
     * @param newBaseCost New base revival cost
     */
    function setBaseRevivalCost(uint256 newBaseCost) external onlyOwner {
        require(newBaseCost > 0, "Cost must be greater than 0");
        baseRevivalCost = newBaseCost;
    }

    /**
     * @dev Update the feeding rate (contract owner only)
     * @param newRate New tokens per health point (with decimals)
     */
    function setFeedingRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Rate must be greater than 0");
        uint256 oldRate = tokensPerHealthPoint;
        tokensPerHealthPoint = newRate;
        emit FeedingRateUpdated(oldRate, newRate);
    }

    function updatePetHealth() external {
        _updatePetHealth();
    }

    // View functions
    function getPetStatus()
        external
        view
        returns (
            string memory name,
            uint256 health,
            bool isAlive,
            uint256 lastFed,
            uint256 totalFeedings
        )
    {
        return (
            pet.name,
            pet.health,
            pet.isAlive,
            pet.lastFed,
            pet.totalFeedings
        );
    }

    /**
     * @dev Get extended pet information including ownership
     */
    function getPetInfo()
        external
        view
        returns (
            string memory name,
            uint256 health,
            bool isAlive,
            uint256 lastFed,
            uint256 totalFeedings,
            uint256 deathCount,
            address currentCaretaker
        )
    {
        return (
            pet.name,
            pet.health,
            pet.isAlive,
            pet.lastFed,
            pet.totalFeedings,
            pet.deathCount,
            pet.currentCaretaker
        );
    }

    function getUserFeedingCount(address user) external view returns (uint256) {
        return userFeedingCount[user];
    }

    function getTimeSinceLastFed() external view returns (uint256) {
        return block.timestamp - pet.lastFed;
    }

    function getCurrentHealth() external view returns (uint256) {
        if (!pet.isAlive) return 0;

        uint256 timeSinceLastFed = block.timestamp - pet.lastFed;
        uint256 hoursPassed = timeSinceLastFed / 3600;
        uint256 healthDecay = hoursPassed * DECAY_RATE;

        if (pet.health <= healthDecay) {
            return 0;
        } else {
            return pet.health - healthDecay;
        }
    }

    /**
     * @dev Get feeding rate information
     * @return tokensFor10Health How many tokens needed for 10 health points
     * @return tokensFor1Health How many tokens needed for 1 health point
     * @return minHealthGain Minimum health gain per feeding
     * @return maxHealthGain Maximum health gain per feeding
     */
    function getFeedingRateInfo()
        external
        view
        returns (
            uint256 tokensFor10Health,
            uint256 tokensFor1Health,
            uint256 minHealthGain,
            uint256 maxHealthGain
        )
    {
        return (
            tokensPerHealthPoint * 10,
            tokensPerHealthPoint,
            MIN_HEALTH_GAIN,
            MAX_HEALTH_GAIN
        );
    }

    // Allow contract to receive ETH/AVAX
    receive() external payable {}
}
