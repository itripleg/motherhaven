// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IBurnManager {
    function notifyBurn(address burner, uint256 amount) external;
    function supportsToken(address token) external view returns (bool);
}

interface IERC20 {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IBurnToken {
    function burn(uint256 amount) external;
}

/**
 * @title VanityNameBurnManager
 * @dev A simple burn manager that processes vanity name requests when tokens are burned
 */
contract VanityNameBurnManager is IBurnManager, Ownable, ReentrancyGuard {
    // =================================================================
    //                           Events
    // =================================================================

    event VanityNameRequested(
        address indexed user,
        string indexed oldName,
        string indexed newName,
        uint256 burnAmount,
        address token,
        uint256 timestamp,
        uint256 requestId
    );

    event VanityNameConfirmed(
        address indexed user,
        string indexed vanityName,
        uint256 requestId,
        uint256 timestamp
    );

    event VanityNameRejected(
        address indexed user,
        string indexed requestedName,
        uint256 requestId,
        string reason,
        uint256 timestamp
    );

    event TokenSupported(address indexed token, bool supported);
    event BurnCostUpdated(uint256 oldCost, uint256 newCost);

    // =================================================================
    //                       Enums & Structs
    // =================================================================

    enum RequestStatus {
        PENDING,
        CONFIRMED,
        REJECTED
    }

    struct VanityNameRequest {
        uint256 requestId;
        address user;
        string oldName;
        string newName;
        uint256 burnAmount;
        address token;
        uint256 timestamp;
        RequestStatus status;
        string rejectionReason;
    }

    // =================================================================
    //                       State Variables
    // =================================================================

    /// @dev Counter for unique request IDs
    uint256 public nextRequestId = 1;

    /// @dev Supported tokens for burning
    mapping(address => bool) public supportedTokens;

    /// @dev All vanity name requests
    mapping(uint256 => VanityNameRequest) public vanityNameRequests;

    /// @dev User's current vanity name
    mapping(address => string) public userVanityNames;

    /// @dev Reverse mapping: name to user (for uniqueness)
    mapping(string => address) public nameToUser;

    /// @dev User's request history
    mapping(address => uint256[]) public userRequests;

    /// @dev Cost to burn tokens for name change (in token units with decimals)
    uint256 public burnCostPerNameChange = 1000 * 1e18; // 1,000 tokens

    /// @dev Maximum length for vanity names
    uint256 public constant MAX_NAME_LENGTH = 32;

    /// @dev Minimum length for vanity names
    uint256 public constant MIN_NAME_LENGTH = 3;

    /// @dev Emergency pause mechanism
    bool public paused = false;

    /// @dev Store intended vanity name per user (set by frontend before burn)
    mapping(address => string) public intendedVanityNames;

    // =================================================================
    //                         Constructor
    // =================================================================

    constructor(address[] memory _initialSupportedTokens) Ownable(msg.sender) {
        // Set initial supported tokens
        for (uint256 i = 0; i < _initialSupportedTokens.length; i++) {
            if (_initialSupportedTokens[i] != address(0)) {
                supportedTokens[_initialSupportedTokens[i]] = true;
                emit TokenSupported(_initialSupportedTokens[i], true);
            }
        }
    }

    // =================================================================
    //                         Modifiers
    // =================================================================

    modifier validToken(address token) {
        require(supportedTokens[token], "Token not supported");
        _;
    }

    modifier requestExists(uint256 requestId) {
        require(
            requestId < nextRequestId && requestId > 0,
            "Request does not exist"
        );
        _;
    }

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

    // =================================================================
    //                   IBurnManager Implementation
    // =================================================================

    /**
     * @dev Called when tokens are burned - processes vanity name request automatically
     * Frontend should call setIntendedVanityName() before burning tokens
     */
    function notifyBurn(
        address burner,
        uint256 amount
    ) external override validToken(msg.sender) notPaused nonReentrant {
        require(amount >= burnCostPerNameChange, "Insufficient burn amount");

        // Get the intended vanity name
        string memory newName = intendedVanityNames[burner];
        require(bytes(newName).length > 0, "No intended vanity name set");

        // Validate the name
        require(_isValidName(newName), "Invalid name format");
        require(bytes(newName).length >= MIN_NAME_LENGTH, "Name too short");
        require(bytes(newName).length <= MAX_NAME_LENGTH, "Name too long");

        // Check if name is available
        string memory lowerNewName = _toLowerCase(newName);
        address currentOwner = nameToUser[lowerNewName];
        require(
            currentOwner == address(0) || currentOwner == burner,
            "Name already taken"
        );

        // Get user's current name
        string memory oldName = userVanityNames[burner];

        // Create the request
        uint256 requestId = nextRequestId++;

        vanityNameRequests[requestId] = VanityNameRequest({
            requestId: requestId,
            user: burner,
            oldName: oldName,
            newName: newName,
            burnAmount: amount,
            token: msg.sender,
            timestamp: block.timestamp,
            status: RequestStatus.CONFIRMED, // Auto-confirm since validation passed
            rejectionReason: ""
        });

        userRequests[burner].push(requestId);

        // Update name mappings
        if (bytes(oldName).length > 0) {
            // Release old name
            delete nameToUser[_toLowerCase(oldName)];
        }
        nameToUser[lowerNewName] = burner;
        userVanityNames[burner] = newName;

        // Clear intended name
        delete intendedVanityNames[burner];

        // Emit events
        emit VanityNameRequested(
            burner,
            oldName,
            newName,
            amount,
            msg.sender,
            block.timestamp,
            requestId
        );

        emit VanityNameConfirmed(burner, newName, requestId, block.timestamp);
    }

    /**
     * @dev Check if this manager supports a specific token
     */
    function supportsToken(
        address token
    ) external view override returns (bool) {
        return supportedTokens[token];
    }

    // =================================================================
    //                       Helper Functions
    // =================================================================

    /**
     * @dev Set intended vanity name (called by frontend before burning)
     * This allows the burn to know what name the user wants
     */
    function setIntendedVanityName(
        string calldata newName
    ) external validName(newName) {
        // Check if name is available
        string memory lowerNewName = _toLowerCase(newName);
        address currentOwner = nameToUser[lowerNewName];
        require(
            currentOwner == address(0) || currentOwner == msg.sender,
            "Name already taken"
        );

        intendedVanityNames[msg.sender] = newName;
    }

    /**
     * @dev Request vanity name with burn in one transaction (recommended)
     * Checks availability and burns tokens atomically
     */
    function requestVanityNameWithBurn(
        string calldata newName,
        address tokenAddress,
        uint256 burnAmount
    )
        external
        validToken(tokenAddress)
        validName(newName)
        notPaused
        nonReentrant
    {
        require(
            burnAmount >= burnCostPerNameChange,
            "Insufficient burn amount"
        );

        // Check if name is available
        string memory lowerNewName = _toLowerCase(newName);
        address currentOwner = nameToUser[lowerNewName];
        require(
            currentOwner == address(0) || currentOwner == msg.sender,
            "Name already taken"
        );

        // Check user has enough tokens
        IERC20 token = IERC20(tokenAddress);
        require(
            token.balanceOf(msg.sender) >= burnAmount,
            "Insufficient token balance"
        );

        // Transfer and burn tokens
        require(
            token.transferFrom(msg.sender, address(this), burnAmount),
            "Token transfer failed"
        );

        // Try to burn tokens (if token supports it)
        try IBurnToken(tokenAddress).burn(burnAmount) {
            // Tokens burned successfully
        } catch {
            // If burn fails, tokens stay in contract (effectively burned from circulation)
        }

        // Get user's current name
        string memory oldName = userVanityNames[msg.sender];

        // Create the request
        uint256 requestId = nextRequestId++;

        vanityNameRequests[requestId] = VanityNameRequest({
            requestId: requestId,
            user: msg.sender,
            oldName: oldName,
            newName: newName,
            burnAmount: burnAmount,
            token: tokenAddress,
            timestamp: block.timestamp,
            status: RequestStatus.CONFIRMED, // Auto-confirm since validation passed
            rejectionReason: ""
        });

        userRequests[msg.sender].push(requestId);

        // Update name mappings
        if (bytes(oldName).length > 0) {
            // Release old name
            delete nameToUser[_toLowerCase(oldName)];
        }
        nameToUser[lowerNewName] = msg.sender;
        userVanityNames[msg.sender] = newName;

        // Emit events
        emit VanityNameRequested(
            msg.sender,
            oldName,
            newName,
            burnAmount,
            tokenAddress,
            block.timestamp,
            requestId
        );

        emit VanityNameConfirmed(
            msg.sender,
            newName,
            requestId,
            block.timestamp
        );
    }

    /**
     * @dev Get user's intended vanity name
     */
    function getIntendedVanityName(
        address user
    ) external view returns (string memory) {
        return intendedVanityNames[user];
    }

    /**
     * @dev Clear intended vanity name (if user wants to cancel)
     */
    function clearIntendedVanityName() external {
        delete intendedVanityNames[msg.sender];
    }

    /**
     * @dev Get a vanity name request
     */
    function getVanityNameRequest(
        uint256 requestId
    )
        external
        view
        requestExists(requestId)
        returns (VanityNameRequest memory)
    {
        return vanityNameRequests[requestId];
    }

    /**
     * @dev Get user's request history
     */
    function getUserRequests(
        address user
    ) external view returns (uint256[] memory) {
        return userRequests[user];
    }

    /**
     * @dev Check if a name is available
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
     */
    function getUserVanityName(
        address user
    ) external view returns (string memory) {
        return userVanityNames[user];
    }

    /**
     * @dev Get user by vanity name
     */
    function getUserByVanityName(
        string calldata name
    ) external view returns (address) {
        return nameToUser[_toLowerCase(name)];
    }

    // =================================================================
    //                       Owner Functions
    // =================================================================

    /**
     * @dev Set supported token
     */
    function setSupportedToken(
        address token,
        bool supported
    ) external onlyOwner {
        require(token != address(0), "Invalid token address");
        supportedTokens[token] = supported;
        emit TokenSupported(token, supported);
    }

    /**
     * @dev Update burn cost for name changes
     */
    function setBurnCost(uint256 newCost) external onlyOwner {
        require(newCost > 0, "Cost must be greater than 0");
        uint256 oldCost = burnCostPerNameChange;
        burnCostPerNameChange = newCost;
        emit BurnCostUpdated(oldCost, newCost);
    }

    /**
     * @dev Pause/unpause the contract
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }

    /**
     * @dev Emergency function to manually release a name
     */
    function emergencyReleaseName(string calldata name) external onlyOwner {
        address user = nameToUser[_toLowerCase(name)];
        require(user != address(0), "Name not reserved");

        delete nameToUser[_toLowerCase(name)];
        delete userVanityNames[user];
    }

    // =================================================================
    //                      Internal Functions
    // =================================================================

    /**
     * @dev Convert string to lowercase for case-insensitive comparison
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

    // =================================================================
    //                       View Functions
    // =================================================================

    /**
     * @dev Get request statistics
     */
    function getRequestStats()
        external
        view
        returns (
            uint256 totalRequests,
            uint256 pendingRequests,
            uint256 confirmedRequests,
            uint256 rejectedRequests
        )
    {
        totalRequests = nextRequestId - 1;

        for (uint256 i = 1; i < nextRequestId; i++) {
            RequestStatus status = vanityNameRequests[i].status;
            if (status == RequestStatus.PENDING) {
                pendingRequests++;
            } else if (status == RequestStatus.CONFIRMED) {
                confirmedRequests++;
            } else if (status == RequestStatus.REJECTED) {
                rejectedRequests++;
            }
        }
    }

    /**
     * @dev Get current burn cost
     */
    function getBurnCost() external view returns (uint256) {
        return burnCostPerNameChange;
    }
}
