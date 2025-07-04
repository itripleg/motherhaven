// contracts/GrandFactory.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;
import "./BurnToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GrandFactory
 * @author Josh Bell
 * @notice This contract is UNLICENSED and proprietary.
 * @dev A factory for creating tokens that trade on a linear bonding curve.
 */
contract GrandFactory is Ownable, ReentrancyGuard {
    enum TokenState {
        NOT_CREATED,
        TRADING,
        GOAL_REACHED,
        HALTED,
        RESUMED
    }

    // =================================================================
    //                           Constants
    // =================================================================
    /// @dev The number of decimal places for the tokens (18).
    uint256 public immutable DECIMALS;
    /// @dev The absolute maximum supply a token can have.
    uint256 public immutable MAX_SUPPLY;
    /// @dev The starting price for the very first token sold on the bonding curve.
    uint256 public immutable INITIAL_PRICE;
    /// @dev The minimum ETH value required for a single purchase.
    uint256 public immutable MIN_PURCHASE;
    /// @dev The maximum ETH value allowed for a single purchase.
    uint256 public immutable MAX_PURCHASE;
    /// @dev The maximum percentage of the total supply a single wallet can hold.
    uint256 public immutable MAX_WALLET_PERCENTAGE;
    /// @dev A coefficient that determines the steepness (slope) of the bonding curve.
    uint256 public immutable PRICE_RATE;
    /// @dev The trading fee expressed in basis points (1/100th of 1%). 30 = 0.3%.
    uint256 public constant TRADING_FEE = 30;

    // =================================================================
    //                         State Variables
    // =================================================================
    /// @dev The default funding goal in ETH (wei) for newly created tokens.
    uint256 public defaultFundingGoal;
    /// @dev The address that receives all trading fees.
    address public feeRecipient;
    /// @dev The default IPFS gateway URL.
    string public defaultIpfsGateway;
    /// @dev An array of all token contract addresses created by this factory.
    address[] private allTokens;
    /// @dev Maps a token address to its current trading state.
    mapping(address => TokenState) public tokens;
    /// @dev Maps a token address to the total ETH collateral backing it.
    mapping(address => uint256) public collateral;
    /// @dev Maps a token address to the address of its original creator.
    mapping(address => address) public tokenCreators;
    /// @dev Maps a token address to the average price of the last transaction.
    mapping(address => uint256) public lastPrice;
    /// @dev Maps a token address to its specific funding goal.
    mapping(address => uint256) private fundingGoals;
    /// @dev Maps a token address to its current total supply.
    mapping(address => uint256) public virtualSupply;

    // =================================================================
    //                              Events
    // =================================================================
    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        string imageUrl,
        address creator,
        uint256 fundingGoal,
        address burnManager,
        uint256 creatorTokens,
        uint256 ethSpent
    );
    event TokensPurchased(
        address indexed token,
        address indexed buyer,
        uint256 amount,
        uint256 price,
        uint256 fee
    );
    event TokensSold(
        address indexed token,
        address indexed seller,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 fee
    );
    event TradingHalted(address indexed token, uint256 collateral);
    event TradingResumed(address indexed token);
    event FeeRecipientUpdated(
        address indexed oldRecipient,
        address indexed newRecipient
    );
    event DefaultFundingGoalUpdated(uint256 oldGoal, uint256 newGoal);
    event TokenFundingGoalUpdated(
        address indexed token,
        uint256 oldGoal,
        uint256 newGoal
    );
    event EmergencyWithdrawal(address indexed owner, uint256 amount);
    event IpfsGatewayUpdated(string oldGateway, string newGateway);

    // =================================================================
    //                            Modifiers
    // =================================================================
    modifier validToken(address tokenAddress) {
        require(
            tokens[tokenAddress] != TokenState.NOT_CREATED,
            "Invalid token"
        );
        _;
    }

    // =================================================================
    //                           Constructor
    // =================================================================
    constructor(address initialOwner) Ownable(initialOwner) {
        require(initialOwner != address(0), "Can't be zero address");
        feeRecipient = initialOwner;
        defaultIpfsGateway = "https://ipfs.io/ipfs/";

        DECIMALS = 10 ** 18;
        MAX_SUPPLY = (10 ** 9) * DECIMALS; // 1 Billion tokens
        defaultFundingGoal = 25 ether;
        INITIAL_PRICE = 0.00001 ether;
        PRICE_RATE = 2000;
        MIN_PURCHASE = INITIAL_PRICE;
        MAX_PURCHASE = 50 ether;
        MAX_WALLET_PERCENTAGE = 5; // 5%
    }

    // =================================================================
    //                      Owner-Only Functions
    // =================================================================
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    function setDefaultIpfsGateway(
        string calldata newGateway
    ) external onlyOwner {
        require(bytes(newGateway).length > 0, "Invalid gateway");
        string memory oldGateway = defaultIpfsGateway;
        defaultIpfsGateway = newGateway;
        emit IpfsGatewayUpdated(oldGateway, newGateway);
    }

    function setDefaultFundingGoal(uint256 newGoal) external onlyOwner {
        require(newGoal > 0, "Invalid funding goal");
        uint256 oldGoal = defaultFundingGoal;
        defaultFundingGoal = newGoal;
        emit DefaultFundingGoalUpdated(oldGoal, newGoal);
    }

    function setTokenFundingGoal(
        address tokenAddress,
        uint256 newGoal
    ) external onlyOwner validToken(tokenAddress) {
        require(newGoal > 0, "Invalid funding goal");
        require(
            tokens[tokenAddress] == TokenState.TRADING ||
                tokens[tokenAddress] == TokenState.RESUMED,
            "Token not in valid state"
        );
        require(
            collateral[tokenAddress] < fundingGoals[tokenAddress],
            "Goal already reached"
        );
        uint256 oldGoal = fundingGoals[tokenAddress];
        fundingGoals[tokenAddress] = newGoal;
        emit TokenFundingGoalUpdated(tokenAddress, oldGoal, newGoal);
        if (collateral[tokenAddress] >= newGoal) {
            tokens[tokenAddress] = TokenState.GOAL_REACHED;
            emit TradingHalted(tokenAddress, newGoal);
        }
    }

    function withdrawAll() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Withdrawal failed");
        emit EmergencyWithdrawal(msg.sender, balance);
    }

    // =================================================================
    //                    Price Calculation Logic
    // =================================================================
    function calculateFee(uint256 amount) public pure returns (uint256) {
        return (amount * TRADING_FEE) / 10000;
    }

    function _calculatePrice(
        uint256 effectiveSupplyStart,
        uint256 effectiveSupplyEnd
    ) internal view returns (uint256) {
        uint256 supplyRange = MAX_SUPPLY;
        require(supplyRange > 0, "Supply range cannot be zero");
        uint256 tokenAmount;
        if (effectiveSupplyEnd > effectiveSupplyStart) {
            tokenAmount = effectiveSupplyEnd - effectiveSupplyStart;
        } else {
            tokenAmount = effectiveSupplyStart - effectiveSupplyEnd;
        }
        uint256 sumOfSupplies = effectiveSupplyEnd + effectiveSupplyStart;
        uint256 scaledSum = PRICE_RATE * sumOfSupplies;
        uint256 costNumerator = INITIAL_PRICE *
            tokenAmount *
            (2 * supplyRange + scaledSum);
        uint256 costDenominator = 2 * supplyRange * DECIMALS;
        require(costDenominator > 0, "Denominator cannot be zero");
        return costNumerator / costDenominator;
    }

    function calculateBuyPrice(
        address tokenAddress,
        uint256 tokenAmount
    ) public view returns (uint256) {
        uint256 effectiveSupplyStart = virtualSupply[tokenAddress];
        uint256 effectiveSupplyEnd = effectiveSupplyStart + tokenAmount;
        return _calculatePrice(effectiveSupplyStart, effectiveSupplyEnd);
    }

    function calculateSellPrice(
        address tokenAddress,
        uint256 tokenAmount
    ) public view returns (uint256) {
        uint256 effectiveSupplyStart = virtualSupply[tokenAddress];
        require(
            effectiveSupplyStart >= tokenAmount,
            "Cannot sell more than effective supply"
        );
        uint256 effectiveSupplyEnd = effectiveSupplyStart - tokenAmount;
        return _calculatePrice(effectiveSupplyStart, effectiveSupplyEnd);
    }

    function calculateTokensForETH(
        address tokenAddress,
        uint256 ethAmount
    ) internal view returns (uint256) {
        uint256 low = 0;
        uint256 high = MAX_SUPPLY - virtualSupply[tokenAddress];
        for (uint i = 0; i < 100; i++) {
            if (low >= high) break;
            uint256 mid = (low + high + 1) / 2;
            if (mid == 0) break;
            uint256 cost = calculateBuyPrice(tokenAddress, mid);
            if (cost <= ethAmount) {
                low = mid;
            } else {
                high = mid - 1;
            }
        }
        return low;
    }

    function calculateTokenAmount(
        address tokenAddress,
        uint256 ethAmount
    ) public view returns (uint256) {
        return calculateTokensForETH(tokenAddress, ethAmount);
    }

    // =================================================================
    //                    Core State-Changing Functions
    // =================================================================

    /**
     * @dev Creates a new token. Supports both traditional URLs and IPFS.
     * @param name The name of the new token.
     * @param symbol The symbol of the new token.
     * @param imageUrl A URL pointing to the token's image OR an IPFS hash (optional).
     * @param burnManager An address with special burn privileges on the token contract.
     * @param minTokensOut Minimum tokens expected if ETH is sent (pass 0 to disable slippage protection).
     * @return The address of the newly created token contract.
     */
    function createToken(
        string calldata name,
        string calldata symbol,
        string calldata imageUrl,
        address burnManager,
        uint256 minTokensOut
    ) external payable returns (address) {
        require(
            bytes(name).length > 0 && bytes(name).length <= 32,
            "Invalid name"
        );
        require(
            bytes(symbol).length > 0 && bytes(symbol).length <= 8,
            "Invalid symbol"
        );

        // If ETH is sent, validate the amount
        if (msg.value > 0) {
            require(
                msg.value >= MIN_PURCHASE && msg.value <= MAX_PURCHASE,
                "Invalid creation amount"
            );
        }

        string memory finalImageUrl;
        address tokenAddress;

        // Block scope to avoid stack too deep
        {
            finalImageUrl = bytes(imageUrl).length > 0
                ? _processImageUrl(imageUrl)
                : "";
            BurnToken token = new BurnToken(
                address(this),
                msg.sender,
                name,
                symbol,
                finalImageUrl,
                burnManager
            );
            tokenAddress = address(token);
        }

        // Initialize token state
        tokens[tokenAddress] = TokenState.TRADING;
        allTokens.push(tokenAddress);
        tokenCreators[tokenAddress] = msg.sender;
        fundingGoals[tokenAddress] = defaultFundingGoal;
        virtualSupply[tokenAddress] = 0;
        lastPrice[tokenAddress] = INITIAL_PRICE;

        uint256 tokensToMint = 0;

        // Process optional purchase in block scope
        if (msg.value > 0) {
            uint256 fee;
            uint256 purchaseAmount;
            {
                fee = calculateFee(msg.value);
                purchaseAmount = msg.value - fee;
                tokensToMint = calculateTokenAmount(
                    tokenAddress,
                    purchaseAmount
                );

                require(
                    tokensToMint > 0,
                    "ETH amount too low to buy any tokens"
                );
                require(
                    tokensToMint >= minTokensOut,
                    "Insufficient output amount"
                );
                require(tokensToMint <= MAX_SUPPLY, "Exceeds max supply");
                require(
                    tokensToMint <= (MAX_SUPPLY * MAX_WALLET_PERCENTAGE) / 100,
                    "Exceeds max wallet"
                );
            }

            // Transfer fee and mint tokens
            (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");

            BurnToken(tokenAddress).mint(msg.sender, tokensToMint);
            virtualSupply[tokenAddress] = tokensToMint;
            collateral[tokenAddress] = purchaseAmount;
            lastPrice[tokenAddress] =
                (purchaseAmount * DECIMALS) /
                tokensToMint;

            if (collateral[tokenAddress] >= fundingGoals[tokenAddress]) {
                tokens[tokenAddress] = TokenState.GOAL_REACHED;
                emit TradingHalted(tokenAddress, fundingGoals[tokenAddress]);
            }
        }

        emit TokenCreated(
            tokenAddress,
            name,
            symbol,
            finalImageUrl,
            msg.sender,
            defaultFundingGoal,
            burnManager,
            tokensToMint,
            msg.value
        );

        return tokenAddress;
    }

    /**
     * @dev Processes image URL - converts IPFS hash to full URL if needed.
     * @param imageUrl The input URL or IPFS hash.
     * @return The processed URL.
     */
    function _processImageUrl(
        string memory imageUrl
    ) internal view returns (string memory) {
        bytes memory urlBytes = bytes(imageUrl);

        // Check if it's an IPFS hash (starts with "Qm" and is 46 chars, or starts with "baf" and is 59 chars)
        if (
            urlBytes.length == 46 && urlBytes[0] == 0x51 && urlBytes[1] == 0x6D
        ) {
            // "Qm"
            return string(abi.encodePacked(defaultIpfsGateway, imageUrl));
        }
        if (
            urlBytes.length == 59 &&
            urlBytes[0] == 0x62 &&
            urlBytes[1] == 0x61 &&
            urlBytes[2] == 0x66
        ) {
            // "baf"
            return string(abi.encodePacked(defaultIpfsGateway, imageUrl));
        }

        // Return as-is if it's a regular URL
        return imageUrl;
    }

    /**
     * @dev Buy tokens with ETH using the bonding curve price.
     * @param tokenAddress The address of the token to purchase.
     * @param minTokensOut Minimum tokens expected (pass 0 to disable slippage protection).
     */
    function buy(
        address tokenAddress,
        uint256 minTokensOut
    ) external payable nonReentrant validToken(tokenAddress) {
        require(
            tokens[tokenAddress] == TokenState.TRADING ||
                tokens[tokenAddress] == TokenState.RESUMED,
            "Not trading"
        );
        require(
            msg.value >= MIN_PURCHASE && msg.value <= MAX_PURCHASE,
            "Invalid amount"
        );
        uint256 fee = calculateFee(msg.value);
        uint256 purchaseAmount = msg.value - fee;
        uint256 tokensToMint = calculateTokenAmount(
            tokenAddress,
            purchaseAmount
        );
        require(tokensToMint > 0, "ETH amount too low to buy any tokens");
        require(tokensToMint >= minTokensOut, "Insufficient output amount");

        BurnToken token = BurnToken(tokenAddress);
        require(
            virtualSupply[tokenAddress] + tokensToMint <= MAX_SUPPLY,
            "Max supply"
        );
        uint256 newBalance = token.balanceOf(msg.sender) + tokensToMint;
        require(
            newBalance <= (MAX_SUPPLY * MAX_WALLET_PERCENTAGE) / 100,
            "Exceeds max wallet"
        );
        (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");
        virtualSupply[tokenAddress] += tokensToMint;
        token.mint(msg.sender, tokensToMint);
        collateral[tokenAddress] += purchaseAmount;
        lastPrice[tokenAddress] = (purchaseAmount * DECIMALS) / tokensToMint;
        emit TokensPurchased(
            tokenAddress,
            msg.sender,
            tokensToMint,
            msg.value,
            fee
        );
        if (collateral[tokenAddress] >= fundingGoals[tokenAddress]) {
            tokens[tokenAddress] = TokenState.GOAL_REACHED;
            emit TradingHalted(tokenAddress, fundingGoals[tokenAddress]);
        }
    }

    function sell(
        address tokenAddress,
        uint256 tokenAmount
    ) external nonReentrant validToken(tokenAddress) {
        require(
            tokens[tokenAddress] == TokenState.TRADING ||
                tokens[tokenAddress] == TokenState.RESUMED,
            "Not trading"
        );
        require(tokenAmount > 0, "Amount must be > 0");
        BurnToken token = BurnToken(tokenAddress);
        require(
            token.balanceOf(msg.sender) >= tokenAmount,
            "Insufficient balance"
        );
        uint256 grossAmount = calculateSellPrice(tokenAddress, tokenAmount);
        uint256 fee = calculateFee(grossAmount);
        uint256 netAmountToReceive = grossAmount - fee;
        require(
            collateral[tokenAddress] >= grossAmount,
            "Insufficient token collateral"
        );
        token.factoryBurn(msg.sender, tokenAmount);
        virtualSupply[tokenAddress] -= tokenAmount;
        collateral[tokenAddress] -= grossAmount;
        lastPrice[tokenAddress] = (grossAmount * DECIMALS) / tokenAmount;
        (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");
        (bool success, ) = payable(msg.sender).call{value: netAmountToReceive}(
            ""
        );
        require(success, "Transfer failed");
        emit TokensSold(
            tokenAddress,
            msg.sender,
            tokenAmount,
            grossAmount,
            fee
        );
    }

    function resumeTrading(address tokenAddress) external {
        require(msg.sender == tokenCreators[tokenAddress], "Not token creator");
        require(
            tokens[tokenAddress] == TokenState.GOAL_REACHED,
            "Not ready to resume"
        );
        tokens[tokenAddress] = TokenState.RESUMED;
        emit TradingResumed(tokenAddress);
    }

    // =================================================================
    //                       Public View Functions
    // =================================================================
    function getTokenState(address token) external view returns (TokenState) {
        return tokens[token];
    }

    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    function getFundingGoal(address token) external view returns (uint256) {
        return fundingGoals[token];
    }
}
