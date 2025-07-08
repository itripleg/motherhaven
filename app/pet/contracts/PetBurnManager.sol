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
 * @dev A simplified burn manager that manages a community pet
 */
contract SimplePetBurnManager is IBurnManager, Ownable, ReentrancyGuard {
    // Events
    event PetFed(
        address indexed feeder,
        uint256 amount,
        uint256 newHealth,
        uint256 timestamp
    );
    event PetDied(uint256 timestamp, string message);
    event PetRevived(address indexed reviver, uint256 timestamp);
    event TokenSupported(address indexed token, bool supported);

    // Pet struct
    struct Pet {
        string name;
        uint256 health; // 0-100
        uint256 lastFed;
        bool isAlive;
        uint256 totalFeedings;
    }

    // State variables
    Pet public pet;
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public userFeedingCount;

    // Constants
    uint256 public constant MAX_HEALTH = 100;
    uint256 public constant DECAY_RATE = 1; // Health decays by 1 per hour
    uint256 public constant DEATH_THRESHOLD = 0;
    uint256 public constant FEEDING_POWER = 10; // Each feeding adds 10 health

    // Revival cost
    uint256 public revivalCost = 0.1 ether;

    constructor() Ownable(msg.sender) {
        pet = Pet({
            name: "Testy",
            health: 50,
            lastFed: block.timestamp,
            isAlive: true,
            totalFeedings: 0
        });
    }

    modifier validToken(address token) {
        require(supportedTokens[token], "Token not supported");
        _;
    }

    modifier petAlive() {
        require(pet.isAlive, "Pet is dead");
        _;
    }

    // IBurnManager implementation
    function notifyBurn(
        address burner,
        uint256 amount
    ) external override validToken(msg.sender) {
        require(amount > 0, "Cannot burn zero tokens");

        _updatePetHealth();

        if (!pet.isAlive) {
            revert("Pet is dead - revive first!");
        }

        // Feed the pet
        uint256 healthGain = FEEDING_POWER;
        if (pet.health + healthGain > MAX_HEALTH) {
            pet.health = MAX_HEALTH;
        } else {
            pet.health += healthGain;
        }

        pet.lastFed = block.timestamp;
        pet.totalFeedings++;
        userFeedingCount[burner]++;

        emit PetFed(burner, amount, pet.health, block.timestamp);
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
                emit PetDied(block.timestamp, "Pet died from neglect");
            } else {
                pet.health -= healthDecay;
            }
        }
    }

    // Revive the pet
    function revivePet() external payable nonReentrant {
        require(!pet.isAlive, "Pet is already alive");
        require(msg.value >= revivalCost, "Insufficient payment");

        pet.isAlive = true;
        pet.health = 50;
        pet.lastFed = block.timestamp;

        // Send payment to owner
        payable(owner()).transfer(msg.value);

        emit PetRevived(msg.sender, block.timestamp);
    }

    // Owner functions
    function setSupportedToken(
        address token,
        bool supported
    ) external onlyOwner {
        supportedTokens[token] = supported;
        emit TokenSupported(token, supported);
    }

    function setRevivalCost(uint256 newCost) external onlyOwner {
        revivalCost = newCost;
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

    // Allow contract to receive ETH/AVAX
    receive() external payable {}
}
