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
 * Players burn tokens to start games, and the AI bot responds with different outcomes.
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
    event GameConfigUpdated(GameType gameType, uint256 minBurn, uint256 maxReward);
    
    // =================================================================
    //                       Enums & Structs
    // =================================================================
    
    enum GameType {
        QUICK_BATTLE,   // Fast, low-stakes game
        ARENA_FIGHT,    // Medium stakes, medium duration
        BOSS_BATTLE     // High stakes, complex mechanics
    }
    
    enum GameOutcome {
        PLAYER_VICTORY, // Player wins, gets reward
        AI_VICTORY,     // AI wins, player gets small consolation
        DRAW,           // Tie, player gets burn amount back
        EPIC_VICTORY    // Rare, player gets bonus reward
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
        uint256 minBurnAmount;      // Minimum tokens to burn for this game type
        uint256 maxRewardMultiplier; // Max reward as multiple of burn amount (in basis points)
        uint256 winProbability;     // Base win probability (in basis points, 10000 = 100%)
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
    
    /// @dev Token balances for rewards
    mapping(address => uint256) public rewardPools;
    
    // =================================================================
    //                         Constructor
    // =================================================================
    
    constructor() Ownable(msg.sender) {
        // Set BigBrainToken (BBT) as the only supported token
        supportedTokens[0x03F86069C82762110ABeb60CaF6Bc31e7d1C1506] = true;
        
        // Initialize game configurations for BBT
        gameConfigs[GameType.QUICK_BATTLE] = GameConfig({
            minBurnAmount: 1000 * 1e18,     // 1,000 BBT tokens
            maxRewardMultiplier: 15000,     // 1.5x max reward
            winProbability: 6000,           // 60% win chance
            enabled: true
        });
        
        gameConfigs[GameType.ARENA_FIGHT] = GameConfig({
            minBurnAmount: 5000 * 1e18,     // 5,000 BBT tokens
            maxRewardMultiplier: 20000,     // 2x max reward
            winProbability: 5000,           // 50% win chance
            enabled: true
        });
        
        gameConfigs[GameType.BOSS_BATTLE] = GameConfig({
            minBurnAmount: 20000 * 1e18,    // 20,000 BBT tokens
            maxRewardMultiplier: 30000,     // 3x max reward
            winProbability: 3000,           // 30% win chance
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
    
    // =================================================================
    //                   IBurnManager Implementation
    // =================================================================
    
    /**
     * @dev Called when tokens are burned, automatically starts a game
     */
    function notifyBurn(address burner, uint256 amount) external override validToken(msg.sender) {
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
        
        emit GameStarted(gameId, burner, token, amount, gameType, block.timestamp);
    }
    
    /**
     * @dev Check if this manager supports a specific token
     */
    function supportsToken(address token) external view override returns (bool) {
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
        
        // Calculate reward based on outcome
        uint256 rewardAmount = _calculateReward(session.token, session.burnedAmount, session.gameType, outcome);
        
        // Update session
        session.outcome = outcome;
        session.rewardAmount = rewardAmount;
        session.aiMessage = aiMessage;
        session.endTime = block.timestamp;
        session.completed = true;
        
        // Process reward if applicable
        if (rewardAmount > 0) {
            _processReward(session.player, session.token, rewardAmount);
        }
        
        emit GameCompleted(gameId, session.player, outcome, rewardAmount, aiMessage, block.timestamp);
    }
    
    /**
     * @dev Get game information
     */
    function getGame(uint256 gameId) external view gameExists(gameId) returns (GameSession memory) {
        return gameSessions[gameId];
    }
    
    /**
     * @dev Get player's game history
     */
    function getPlayerGames(address player) external view returns (uint256[] memory) {
        return playerGames[player];
    }
    
    /**
     * @dev Get active (uncompleted) games for a player
     */
    function getPlayerActiveGames(address player) external view returns (uint256[] memory) {
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
    //                       Owner Functions
    // =================================================================
    
    /**
     * @dev Add or remove token support
     */
    function setSupportedToken(address token, bool supported) external onlyOwner {
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
        uint256 maxRewardMultiplier,
        uint256 winProbability,
        bool enabled
    ) external onlyOwner {
        require(maxRewardMultiplier <= 50000, "Reward multiplier too high"); // Max 5x
        require(winProbability <= 10000, "Invalid probability");
        
        gameConfigs[gameType] = GameConfig({
            minBurnAmount: minBurnAmount,
            maxRewardMultiplier: maxRewardMultiplier,
            winProbability: winProbability,
            enabled: enabled
        });
        
        emit GameConfigUpdated(gameType, minBurnAmount, maxRewardMultiplier);
    }
    
    /**
     * @dev Add tokens to reward pool
     */
    function addToRewardPool(address token, uint256 amount) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        rewardPools[token] += amount;
    }
    
    /**
     * @dev Emergency withdraw from reward pool
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(amount <= rewardPools[token], "Insufficient pool balance");
        rewardPools[token] -= amount;
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
    }
    
    // =================================================================
    //                      Internal Functions
    // =================================================================
    
    /**
     * @dev Determine game type based on burn amount
     */
    function _determineGameType(address /* token */, uint256 amount) internal view returns (GameType) {
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
     * @dev Calculate reward based on game outcome
     */
    function _calculateReward(
        address token,
        uint256 burnAmount,
        GameType gameType,
        GameOutcome outcome
    ) internal view returns (uint256) {
        if (outcome == GameOutcome.AI_VICTORY) {
            return burnAmount / 10; // 10% consolation prize
        } else if (outcome == GameOutcome.DRAW) {
            return burnAmount; // Get burn amount back
        } else if (outcome == GameOutcome.PLAYER_VICTORY) {
            GameConfig memory config = gameConfigs[gameType];
            return (burnAmount * config.maxRewardMultiplier) / 10000;
        } else if (outcome == GameOutcome.EPIC_VICTORY) {
            GameConfig memory config = gameConfigs[gameType];
            return (burnAmount * config.maxRewardMultiplier * 2) / 10000; // Double reward for epic victory
        }
        
        return 0;
    }
    
    /**
     * @dev Process reward payment to player
     */
    function _processReward(address player, address token, uint256 rewardAmount) internal {
        require(rewardPools[token] >= rewardAmount, "Insufficient reward pool");
        
        // Update pool and transfer full reward to player
        rewardPools[token] -= rewardAmount;
        require(IERC20(token).transfer(player, rewardAmount), "Reward transfer failed");
    }
    
    // =================================================================
    //                       View Functions
    // =================================================================
    
    /**
     * @dev Get game statistics
     */
    function getGameStats() external view returns (
        uint256 totalGames,
        uint256 completedGames,
        uint256 activeGames
    ) {
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
     * @dev Get reward pool balance for a token
     */
    function getRewardPool(address token) external view returns (uint256) {
        return rewardPools[token];
    }
    
    /**
     * @dev Get game configuration
     */
    function getGameConfig(GameType gameType) external view returns (GameConfig memory) {
        return gameConfigs[gameType];
    }
}