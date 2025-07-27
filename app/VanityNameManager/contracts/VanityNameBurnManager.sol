// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IBurnManager {
    function notifyBurn(address burner, uint256 amount) external;
    function supportsToken(address token) external view returns (bool);
}

/**
 * @title VanityNameBurnManager
 * @dev Burn-to-earn paradigm: Users burn tokens to earn the right to set vanity names
 * @author Your Team
 * @notice This contract allows users to burn supported tokens to earn vanity name changes
 */
contract VanityNameBurnManager is IBurnManager, Ownable, ReentrancyGuard {
    // =================================================================
    //                           Events
    // =================================================================

    event TokensBurned(
        address indexed burner,
        uint256 amount,
        uint256 newBurnBalance,
        uint256 timestamp
    );

    event VanityNameSet(
        address indexed user,
        string indexed oldName,
        string indexed newName,
        uint256 timestamp
    );

    event BurnCostUpdated(uint256 oldCost, uint256 newCost);

    event BurnTokenUpdated(address indexed oldToken, address indexed newToken);

    event ContractPaused(bool paused);

    event NameReleased(string indexed name, address indexed previousOwner);

    event BalanceAdjusted(
        address indexed user,
        uint256 oldBurnBalance,
        uint256 newBurnBalance,
        uint256 oldSpentBalance,
        uint256 newSpentBalance
    );

    // =================================================================
    //                       State Variables
    // =================================================================

    /// @dev The token address that can be burned for vanity names
    address public burnToken;

    /// @dev Track how many tokens each user has burned
    mapping(address => uint256) public userBurnBalance;

    /// @dev Track how many tokens each user has spent on vanity names
    mapping(address => uint256) public userSpentBalance;

    /// @dev User's current vanity name
    mapping(address => string) public userVanityNames;

    /// @dev Reverse mapping: name to user (for uniqueness)
    mapping(string => address) public nameToUser;

    /// @dev Cost per name change (in token units with decimals)
    uint256 public costPerNameChange = 1000 * 1e18; // 1,000 tokens

    /// @dev Maximum length for vanity names
    uint256 public constant MAX_NAME_LENGTH = 32;

    /// @dev Minimum length for vanity names
    uint256 public constant MIN_NAME_LENGTH = 3;

    /// @dev Emergency pause mechanism
    bool public paused = false;

    /// @dev Contract version for upgrades/migrations
    string public constant VERSION = "1.0.0";

    // =================================================================
    //                         Constructor
    // =================================================================

    constructor(address initialOwner) Ownable(initialOwner) {
        require(initialOwner != address(0), "Invalid owner address");
    }

    // =================================================================
    //                         Modifiers
    // =================================================================

    modifier notPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier validName(string memory name) {
        require(bytes(name).length >= MIN_NAME_LENGTH, "Name too short");
        require(bytes(name).length <= MAX_NAME_LENGTH, "Name too long");
        require(_isValidName(name), "Invalid name format");
        _;
    }

    modifier onlyBurnToken() {
        require(msg.sender == burnToken, "Only burn token can notify");
        require(burnToken != address(0), "Burn token not set");
        _;
    }

    // =================================================================
    //                   IBurnManager Implementation
    // =================================================================

    /**
     * @dev Called when users burn tokens - adds to their burn balance
     * @param burner The address that burned tokens
     * @param amount The amount of tokens burned
     */
    function notifyBurn(
        address burner,
        uint256 amount
    ) external override onlyBurnToken {
        require(amount > 0, "Cannot burn zero tokens");

        userBurnBalance[burner] += amount;

        emit TokensBurned(
            burner,
            amount,
            userBurnBalance[burner],
            block.timestamp
        );
    }

    /**
     * @dev Check if this manager supports a specific token
     * @param token The token address to check
     * @return bool True if the token is supported
     */
    function supportsToken(
        address token
    ) external view override returns (bool) {
        return token == burnToken && burnToken != address(0);
    }

    // =================================================================
    //                    Main Function - Set Vanity Name
    // =================================================================

    /**
     * @dev Set vanity name using burned token balance
     * @param newName The desired vanity name
     */
    function setVanityName(
        string calldata newName
    ) external validName(newName) notPaused nonReentrant {
        require(burnToken != address(0), "Burn token not set");

        // Check user has enough burned tokens available
        uint256 availableBalance = userBurnBalance[msg.sender] -
            userSpentBalance[msg.sender];
        require(
            availableBalance >= costPerNameChange,
            "Insufficient burn balance - burn more tokens first"
        );

        // Check if name is available (double-check for race conditions)
        string memory lowerNewName = _toLowerCase(newName);
        address currentOwner = nameToUser[lowerNewName];
        require(
            currentOwner == address(0) || currentOwner == msg.sender,
            "Name already taken"
        );

        // Get user's current name for event
        string memory oldName = userVanityNames[msg.sender];

        // Spend the burned tokens
        userSpentBalance[msg.sender] += costPerNameChange;

        // Update name mappings
        if (bytes(oldName).length > 0) {
            // Release old name
            delete nameToUser[_toLowerCase(oldName)];
        }

        // Set new name
        nameToUser[lowerNewName] = msg.sender;
        userVanityNames[msg.sender] = newName;

        // Emit event
        emit VanityNameSet(msg.sender, oldName, newName, block.timestamp);
    }

    // =================================================================
    //                       View Functions
    // =================================================================

    /**
     * @dev Check if a name is available
     * @param name The name to check
     * @return bool True if the name is available
     */
    function isNameAvailable(
        string calldata name
    ) external view returns (bool) {
        if (
            bytes(name).length < MIN_NAME_LENGTH ||
            bytes(name).length > MAX_NAME_LENGTH
        ) {
            return false;
        }
        if (!_isValidName(name)) {
            return false;
        }
        return nameToUser[_toLowerCase(name)] == address(0);
    }

    /**
     * @dev Get user's current vanity name
     * @param user The user address
     * @return string The user's vanity name
     */
    function getUserVanityName(
        address user
    ) external view returns (string memory) {
        return userVanityNames[user];
    }

    /**
     * @dev Get user by vanity name
     * @param name The vanity name to lookup
     * @return address The owner of the name
     */
    function getUserByVanityName(
        string calldata name
    ) external view returns (address) {
        return nameToUser[_toLowerCase(name)];
    }

    /**
     * @dev Get current cost per name change
     * @return uint256 The cost in token wei
     */
    function getCostPerNameChange() external view returns (uint256) {
        return costPerNameChange;
    }

    /**
     * @dev Get user's burn balance info
     * @param user The user address
     * @return totalBurned Total tokens burned by user
     * @return totalSpent Total tokens spent on name changes
     * @return availableBalance Available tokens for name changes
     * @return possibleNameChanges Number of name changes possible
     */
    function getUserBurnInfo(
        address user
    )
        external
        view
        returns (
            uint256 totalBurned,
            uint256 totalSpent,
            uint256 availableBalance,
            uint256 possibleNameChanges
        )
    {
        totalBurned = userBurnBalance[user];
        totalSpent = userSpentBalance[user];
        availableBalance = totalBurned - totalSpent;
        possibleNameChanges = availableBalance / costPerNameChange;
    }

    /**
     * @dev Check if user can set a vanity name
     * @param user The user address to check
     * @return bool True if user has sufficient burn balance
     */
    function canUserSetName(address user) external view returns (bool) {
        if (burnToken == address(0)) return false;

        uint256 availableBalance = userBurnBalance[user] -
            userSpentBalance[user];
        return availableBalance >= costPerNameChange;
    }

    /**
     * @dev Get the current burn token address
     * @return address The burn token contract address
     */
    function getBurnToken() external view returns (address) {
        return burnToken;
    }

    /**
     * @dev Get contract information
     * @return version Contract version
     * @return tokenAddr Current burn token address
     * @return cost Cost per name change
     * @return isPaused Whether contract is paused
     */
    function getContractInfo()
        external
        view
        returns (
            string memory version,
            address tokenAddr,
            uint256 cost,
            bool isPaused
        )
    {
        return (VERSION, burnToken, costPerNameChange, paused);
    }

    // =================================================================
    //                       Owner Functions
    // =================================================================

    /**
     * @dev Set the burn token address
     * @param _burnToken The new burn token address
     */
    function setBurnToken(address _burnToken) external onlyOwner {
        require(_burnToken != address(0), "Burn token cannot be zero address");

        // Optional: Check if the address has code (is a contract)
        require(_burnToken.code.length > 0, "Burn token must be a contract");

        address oldToken = burnToken;
        burnToken = _burnToken;

        emit BurnTokenUpdated(oldToken, _burnToken);
    }

    /**
     * @dev Update cost per name change
     * @param newCost The new cost in token wei
     */
    function setCostPerNameChange(uint256 newCost) external onlyOwner {
        require(newCost > 0, "Cost must be greater than 0");
        require(newCost <= 1000000 * 1e18, "Cost too high"); // Max 1M tokens

        uint256 oldCost = costPerNameChange;
        costPerNameChange = newCost;
        emit BurnCostUpdated(oldCost, newCost);
    }

    /**
     * @dev Pause/unpause the contract
     * @param _paused Whether to pause the contract
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit ContractPaused(_paused);
    }

    /**
     * @dev Emergency function to manually release a name
     * @param name The name to release
     */
    function emergencyReleaseName(string calldata name) external onlyOwner {
        string memory lowerName = _toLowerCase(name);
        address user = nameToUser[lowerName];
        require(user != address(0), "Name not reserved");

        delete nameToUser[lowerName];
        delete userVanityNames[user];

        emit NameReleased(name, user);
    }

    /**
     * @dev Emergency function to adjust user balances (for migrations/fixes)
     * @param user The user to adjust
     * @param newBurnBalance New burn balance
     * @param newSpentBalance New spent balance
     */
    function emergencyAdjustBalance(
        address user,
        uint256 newBurnBalance,
        uint256 newSpentBalance
    ) external onlyOwner {
        require(
            newSpentBalance <= newBurnBalance,
            "Spent cannot exceed burned"
        );

        uint256 oldBurnBalance = userBurnBalance[user];
        uint256 oldSpentBalance = userSpentBalance[user];

        userBurnBalance[user] = newBurnBalance;
        userSpentBalance[user] = newSpentBalance;

        emit BalanceAdjusted(
            user,
            oldBurnBalance,
            newBurnBalance,
            oldSpentBalance,
            newSpentBalance
        );
    }

    /**
     * @dev Batch adjust multiple user balances (for migrations)
     * @param users Array of user addresses
     * @param burnBalances Array of new burn balances
     * @param spentBalances Array of new spent balances
     */
    function batchAdjustBalances(
        address[] calldata users,
        uint256[] calldata burnBalances,
        uint256[] calldata spentBalances
    ) external onlyOwner {
        require(
            users.length == burnBalances.length &&
                users.length == spentBalances.length,
            "Array length mismatch"
        );
        require(users.length <= 100, "Batch too large"); // Gas limit protection

        for (uint256 i = 0; i < users.length; i++) {
            require(
                spentBalances[i] <= burnBalances[i],
                "Spent cannot exceed burned"
            );

            uint256 oldBurnBalance = userBurnBalance[users[i]];
            uint256 oldSpentBalance = userSpentBalance[users[i]];

            userBurnBalance[users[i]] = burnBalances[i];
            userSpentBalance[users[i]] = spentBalances[i];

            emit BalanceAdjusted(
                users[i],
                oldBurnBalance,
                burnBalances[i],
                oldSpentBalance,
                spentBalances[i]
            );
        }
    }

    // =================================================================
    //                      Internal Functions
    // =================================================================

    /**
     * @dev Convert string to lowercase for case-insensitive comparison
     * @param str The string to convert
     * @return string The lowercase string
     */
    function _toLowerCase(
        string memory str
    ) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory lowerBytes = new bytes(strBytes.length);

        for (uint256 i = 0; i < strBytes.length; i++) {
            // Convert A-Z to a-z
            if (strBytes[i] >= 0x41 && strBytes[i] <= 0x5A) {
                lowerBytes[i] = bytes1(uint8(strBytes[i]) + 32);
            } else {
                lowerBytes[i] = strBytes[i];
            }
        }

        return string(lowerBytes);
    }

    /**
     * @dev Validate name format (alphanumeric + underscore only)
     * @param name The name to validate
     * @return bool True if name format is valid
     */
    function _isValidName(string memory name) internal pure returns (bool) {
        bytes memory nameBytes = bytes(name);

        for (uint256 i = 0; i < nameBytes.length; i++) {
            bytes1 char = nameBytes[i];

            // Allow a-z, A-Z, 0-9, underscore
            if (
                !((char >= 0x30 && char <= 0x39) || // 0-9
                    (char >= 0x41 && char <= 0x5A) || // A-Z
                    (char >= 0x61 && char <= 0x7A) || // a-z
                    char == 0x5F) // underscore
            ) {
                return false;
            }
        }

        return true;
    }
}
