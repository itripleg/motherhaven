// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBurnManager {
    function notifyBurn(address burner, uint256 amount) external;
    function supportsToken(address token) external view returns (bool);
}

/**
 * @title GameBurnManager
 * @dev A burn manager that creates game sessions where players burn tokens to battle an AI adversary.
 * Players burn tokens to start games, and rewards are paid out in AVAX.
 */
contract GameBurnManager is IBurnManager, Ownable, ReentrancyGuard {
    // =================================================================
    //                           Events
    // =================================================================

    event GameStarted(
        uint256 indexed gameId,
        address indexed player,
        address indexed token,
        uint256 burnedAmount,
        GameType gameType,
        uint256 timestamp
    );

    event GameCompleted(
        uint256 indexed gameId,
        address indexed player,
        GameOutcome outcome,
        uint256 rewardAmount,
        string aiMessage,
        uint256 timestamp
    );

    event TokenSupported(address indexed token, bool supported);
    event GameConfigUpdated(
        GameType gameType,
        uint256 minBurn,
        uint256 rewardMultiplier
    );
    event AvaxDeposited(address indexed depositor, uint256 amount);
    event AvaxWithdrawn(address indexed recipient, uint256 amount);

    // =================================================================
    //                       Enums & Structs
    // =================================================================

    enum GameType {
        QUICK_BATTLE, // Fast, low-stakes game
        ARENA_FIGHT, // Medium stakes, medium duration
        BOSS_BATTLE // High stakes, complex mechanics
    }

    enum GameOutcome {
        PLAYER_VICTORY, // Player wins, gets reward
        AI_VICTORY, // AI wins, player gets small consolation
        DRAW, // Tie, player gets some reward back
        EPIC_VICTORY // Rare, player gets bonus reward
    }

    struct GameSession {
        uint256 gameId;
        address player;
        address token;
        uint256 burnedAmount;
        GameType gameType;
        GameOutcome outcome;
        uint256 rewardAmount;
        string aiMessage;
        uint256 startTime;
        uint256 endTime;
        bool completed;
    }

    struct GameConfig {
        uint256 minBurnAmount; // Minimum tokens to burn for this game type
        uint256 baseRewardWei; // Base AVAX reward in wei
        uint256 rewardPerToken; // Additional AVAX reward per token burned (in wei)
        uint256 winProbability; // Base win probability (in basis points, 10000 = 100%)
        bool enabled;
    }

    // =================================================================
    //                       State Variables
    // =================================================================

    /// @dev Counter for unique game IDs
    uint256 public nextGameId = 1;

    /// @dev Supported tokens for burning
    mapping(address => bool) public supportedTokens;

    /// @dev Game configurations for each game type
    mapping(GameType => GameConfig) public gameConfigs;

    /// @dev All game sessions
    mapping(uint256 => GameSession) public gameSessions;

    /// @dev Player's active games
    mapping(address => uint256[]) public playerGames;

    /// @dev Total AVAX available for rewards
    uint256 public avaxRewardPool;

    /// @dev Emergency pause mechanism
    bool public paused = false;

    // =================================================================
    //                         Constructor
    // =================================================================

    constructor() Ownable(msg.sender) {
        // Set BigBrainToken (BBT) as the only supported token
        supportedTokens[0x03F86069C82762110ABeb60CaF6Bc31e7d1C1506] = true;

        // Initialize game configurations for BBT
        // Rewards are now in AVAX (wei), not token amounts
        gameConfigs[GameType.QUICK_BATTLE] = GameConfig({
            minBurnAmount: 1000 * 1e18, // 1,000 BBT tokens
            baseRewardWei: 0.001 ether, // 0.001 AVAX base reward
            rewardPerToken: 0.0000001 ether, // 0.0000001 AVAX per BBT burned
            winProbability: 6000, // 60% win chance
            enabled: true
        });

        gameConfigs[GameType.ARENA_FIGHT] = GameConfig({
            minBurnAmount: 5000 * 1e18, // 5,000 BBT tokens
            baseRewardWei: 0.005 ether, // 0.005 AVAX base reward
            rewardPerToken: 0.0000002 ether, // 0.0000002 AVAX per BBT burned
            winProbability: 5000, // 50% win chance
            enabled: true
        });

        gameConfigs[GameType.BOSS_BATTLE] = GameConfig({
            minBurnAmount: 20000 * 1e18, // 20,000 BBT tokens
            baseRewardWei: 0.02 ether, // 0.02 AVAX base reward
            rewardPerToken: 0.0000005 ether, // 0.0000005 AVAX per BBT burned
            winProbability: 3000, // 30% win chance
            enabled: true
        });
    }

    // =================================================================
    //                         Modifiers
    // =================================================================

    modifier validToken(address token) {
        require(supportedTokens[token], "Token not supported");
        _;
    }

    modifier gameExists(uint256 gameId) {
        require(gameId < nextGameId && gameId > 0, "Game does not exist");
        _;
    }

    modifier notPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // =================================================================
    //                   IBurnManager Implementation
    // =================================================================

    /**
     * @dev Called when tokens are burned, automatically starts a game
     */
    function notifyBurn(
        address burner,
        uint256 amount
    ) external override validToken(msg.sender) notPaused {
        address token = msg.sender;

        // Determine game type based on burn amount
        GameType gameType = _determineGameType(token, amount);

        // Validate burn amount meets minimum
        GameConfig memory config = gameConfigs[gameType];
        require(config.enabled, "Game type not enabled");
        require(amount >= config.minBurnAmount, "Burn amount too low");

        // Create game session
        uint256 gameId = nextGameId++;

        gameSessions[gameId] = GameSession({
            gameId: gameId,
            player: burner,
            token: token,
            burnedAmount: amount,
            gameType: gameType,
            outcome: GameOutcome.PLAYER_VICTORY, // Placeholder, will be set by AI
            rewardAmount: 0,
            aiMessage: "",
            startTime: block.timestamp,
            endTime: 0,
            completed: false
        });

        playerGames[burner].push(gameId);

        emit GameStarted(
            gameId,
            burner,
            token,
            amount,
            gameType,
            block.timestamp
        );
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
    //                       Game Mechanics
    // =================================================================

    /**
     * @dev Owner completes a game with outcome and message (AI bot functionality)
     */
    function completeGame(
        uint256 gameId,
        GameOutcome outcome,
        string calldata aiMessage
    ) external onlyOwner gameExists(gameId) nonReentrant {
        GameSession storage session = gameSessions[gameId];
        require(!session.completed, "Game already completed");

        // Calculate AVAX reward based on outcome
        uint256 rewardAmount = _calculateAvaxReward(
            session.burnedAmount,
            session.gameType,
            outcome
        );

        // Check if we have enough AVAX to pay the reward
        require(
            avaxRewardPool >= rewardAmount,
            "Insufficient AVAX reward pool"
        );

        // Update session
        session.outcome = outcome;
        session.rewardAmount = rewardAmount;
        session.aiMessage = aiMessage;
        session.endTime = block.timestamp;
        session.completed = true;

        // Process AVAX reward if applicable
        if (rewardAmount > 0) {
            avaxRewardPool -= rewardAmount;

            // Send AVAX to player
            (bool success, ) = payable(session.player).call{
                value: rewardAmount
            }("");
            require(success, "AVAX reward transfer failed");
        }

        emit GameCompleted(
            gameId,
            session.player,
            outcome,
            rewardAmount,
            aiMessage,
            block.timestamp
        );
    }

    /**
     * @dev Get game information
     */
    function getGame(
        uint256 gameId
    ) external view gameExists(gameId) returns (GameSession memory) {
        return gameSessions[gameId];
    }

    /**
     * @dev Get player's game history
     */
    function getPlayerGames(
        address player
    ) external view returns (uint256[] memory) {
        return playerGames[player];
    }

    /**
     * @dev Get active (uncompleted) games for a player
     */
    function getPlayerActiveGames(
        address player
    ) external view returns (uint256[] memory) {
        uint256[] memory allGames = playerGames[player];
        uint256 activeCount = 0;

        // Count active games
        for (uint256 i = 0; i < allGames.length; i++) {
            if (!gameSessions[allGames[i]].completed) {
                activeCount++;
            }
        }

        // Create array of active games
        uint256[] memory activeGames = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allGames.length; i++) {
            if (!gameSessions[allGames[i]].completed) {
                activeGames[index] = allGames[i];
                index++;
            }
        }

        return activeGames;
    }

    // =================================================================
    //                       AVAX Management
    // =================================================================

    /**
     * @dev Deposit AVAX to fund rewards (anyone can call)
     */
    function depositAvax() external payable {
        require(msg.value > 0, "Must send AVAX");
        avaxRewardPool += msg.value;
        emit AvaxDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw AVAX from reward pool (owner only)
     */
    function withdrawAvax(uint256 amount) external onlyOwner {
        require(amount <= avaxRewardPool, "Insufficient pool balance");
        avaxRewardPool -= amount;

        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "AVAX withdrawal failed");

        emit AvaxWithdrawn(owner(), amount);
    }

    /**
     * @dev Emergency withdraw all AVAX (owner only)
     */
    function emergencyWithdrawAvax() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No AVAX to withdraw");

        avaxRewardPool = 0;

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Emergency withdrawal failed");

        emit AvaxWithdrawn(owner(), balance);
    }

    // =================================================================
    //                       Owner Functions
    // =================================================================

    /**
     * @dev Add or remove token support
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
     * @dev Update game configuration
     */
    function setGameConfig(
        GameType gameType,
        uint256 minBurnAmount,
        uint256 baseRewardWei,
        uint256 rewardPerToken,
        uint256 winProbability,
        bool enabled
    ) external onlyOwner {
        require(winProbability <= 10000, "Invalid probability");

        gameConfigs[gameType] = GameConfig({
            minBurnAmount: minBurnAmount,
            baseRewardWei: baseRewardWei,
            rewardPerToken: rewardPerToken,
            winProbability: winProbability,
            enabled: enabled
        });

        emit GameConfigUpdated(gameType, minBurnAmount, rewardPerToken);
    }

    /**
     * @dev Pause/unpause the contract
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }

    // =================================================================
    //                      Internal Functions
    // =================================================================

    /**
     * @dev Determine game type based on burn amount
     */
    function _determineGameType(
        address /* token */,
        uint256 amount
    ) internal view returns (GameType) {
        // Only BBT is supported, so use standard thresholds
        if (amount >= gameConfigs[GameType.BOSS_BATTLE].minBurnAmount) {
            return GameType.BOSS_BATTLE;
        } else if (amount >= gameConfigs[GameType.ARENA_FIGHT].minBurnAmount) {
            return GameType.ARENA_FIGHT;
        } else {
            return GameType.QUICK_BATTLE;
        }
    }

    /**
     * @dev Calculate AVAX reward based on game outcome
     */
    function _calculateAvaxReward(
        uint256 burnAmount,
        GameType gameType,
        GameOutcome outcome
    ) internal view returns (uint256) {
        GameConfig memory config = gameConfigs[gameType];

        if (outcome == GameOutcome.AI_VICTORY) {
            // Small consolation prize: 10% of base reward
            return config.baseRewardWei / 10;
        } else if (outcome == GameOutcome.DRAW) {
            // Moderate reward: 50% of full calculated reward
            uint256 fullReward = config.baseRewardWei +
                ((burnAmount * config.rewardPerToken) / 1e18);
            return fullReward / 2;
        } else if (outcome == GameOutcome.PLAYER_VICTORY) {
            // Full reward: base + per-token bonus
            return
                config.baseRewardWei +
                ((burnAmount * config.rewardPerToken) / 1e18);
        } else if (outcome == GameOutcome.EPIC_VICTORY) {
            // Epic reward: 2x full reward
            uint256 fullReward = config.baseRewardWei +
                ((burnAmount * config.rewardPerToken) / 1e18);
            return fullReward * 2;
        }

        return 0;
    }

    // =================================================================
    //                       View Functions
    // =================================================================

    /**
     * @dev Get game statistics
     */
    function getGameStats()
        external
        view
        returns (
            uint256 totalGames,
            uint256 completedGames,
            uint256 activeGames
        )
    {
        totalGames = nextGameId - 1;

        for (uint256 i = 1; i < nextGameId; i++) {
            if (gameSessions[i].completed) {
                completedGames++;
            } else {
                activeGames++;
            }
        }
    }

    /**
     * @dev Get AVAX reward pool balance
     */
    function getAvaxRewardPool() external view returns (uint256) {
        return avaxRewardPool;
    }

    /**
     * @dev Get game configuration
     */
    function getGameConfig(
        GameType gameType
    ) external view returns (GameConfig memory) {
        return gameConfigs[gameType];
    }

    /**
     * @dev Calculate potential AVAX reward for a burn amount and game type
     */
    function calculatePotentialReward(
        uint256 burnAmount,
        GameType gameType,
        GameOutcome outcome
    ) external view returns (uint256) {
        return _calculateAvaxReward(burnAmount, gameType, outcome);
    }

    // =================================================================
    //                       Receive Function
    // =================================================================

    /**
     * @dev Allow contract to receive AVAX directly
     */
    receive() external payable {
        avaxRewardPool += msg.value;
        emit AvaxDeposited(msg.sender, msg.value);
    }
}
