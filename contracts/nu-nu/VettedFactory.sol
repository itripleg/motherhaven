// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./VettedToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenFactory is Ownable, ReentrancyGuard {
    enum TokenState {
        NOT_CREATED,
        TRADING,
        GOAL_REACHED,
        HALTED,
        RESUMED
    }

    // Constants
    uint256 public immutable DECIMALS;
    uint256 public immutable MAX_SUPPLY;
    uint256 public immutable INITIAL_MINT;
    uint256 public immutable INITIAL_PRICE;
    uint256 public immutable MIN_PURCHASE;
    uint256 public immutable MAX_PURCHASE;
    uint256 public immutable MAX_WALLET_PERCENTAGE;
    uint256 public immutable PRICE_RATE;
    uint256 public constant TRADING_FEE = 30; // 0.3% = 30 basis points

    uint256 public defaultFundingGoal;
    address public feeRecipient;

    // State variables
    address[] private allTokens;
    mapping(address => TokenState) public tokens;
    mapping(address => uint256) public collateral;
    mapping(address => address) public tokenCreators;
    mapping(address => uint256) public lastPrice;
    mapping(address => uint256) private fundingGoals;
    mapping(address => uint256) public virtualSupply;

    // Events
    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        string imageUrl,
        address creator,
        uint256 fundingGoal,
        address burnManager
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

    modifier validToken(address tokenAddress) {
        require(
            tokens[tokenAddress] != TokenState.NOT_CREATED,
            "Invalid token"
        );
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        require(initialOwner != address(0), "Can't be zero address");
        feeRecipient = initialOwner;
        DECIMALS = 10 ** 18;
        MAX_SUPPLY = (10 ** 9) * DECIMALS;
        INITIAL_MINT = (MAX_SUPPLY * 20) / 100;
        defaultFundingGoal = 25 ether;
        INITIAL_PRICE = 0.00001 ether;
        PRICE_RATE = 2000;
        MIN_PURCHASE = INITIAL_PRICE;
        MAX_PURCHASE = 50 ether;
        MAX_WALLET_PERCENTAGE = 5;
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
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

    function calculateFee(uint256 amount) public pure returns (uint256) {
        return (amount * TRADING_FEE) / 10000;
    }

    function createToken(
        string calldata name,
        string calldata symbol,
        string calldata imageUrl,
        address burnManager
    ) external returns (address) {
        require(
            bytes(name).length > 0 && bytes(name).length <= 32,
            "Invalid name"
        );
        require(
            bytes(symbol).length > 0 && bytes(symbol).length <= 8,
            "Invalid symbol"
        );
        require(bytes(imageUrl).length > 0, "Invalid image URL");

        Token token = new Token(
            address(this),
            msg.sender,
            name,
            symbol,
            imageUrl,
            burnManager
        );
        address tokenAddress = address(token);

        tokens[tokenAddress] = TokenState.TRADING;
        allTokens.push(tokenAddress);
        tokenCreators[tokenAddress] = msg.sender;
        lastPrice[tokenAddress] = INITIAL_PRICE;
        fundingGoals[tokenAddress] = defaultFundingGoal;
        virtualSupply[tokenAddress] = INITIAL_MINT;

        emit TokenCreated(
            tokenAddress,
            name,
            symbol,
            imageUrl,
            msg.sender,
            defaultFundingGoal,
            burnManager
        );
        return tokenAddress;
    }

    function buy(
        address tokenAddress
    ) external payable validToken(tokenAddress) {
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

        Token token = Token(tokenAddress);
        uint256 tokensToMint = calculateTokenAmount(
            tokenAddress,
            purchaseAmount
        );
        require(
            virtualSupply[tokenAddress] + tokensToMint <= MAX_SUPPLY,
            "Max supply"
        );

        // Check max wallet percentage including existing balance
        uint256 newBalance = token.balanceOf(msg.sender) + tokensToMint;
        require(
            newBalance <= (MAX_SUPPLY * MAX_WALLET_PERCENTAGE) / 100,
            "Exceeds max wallet"
        );

        uint256 newPrice = getCurrentPrice(tokenAddress);

        (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        virtualSupply[tokenAddress] += tokensToMint;
        token.mint(msg.sender, tokensToMint);

        collateral[tokenAddress] += purchaseAmount;
        lastPrice[tokenAddress] = newPrice;

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

    // should now remove fee from final proceeds to fix collaterall bug
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

        Token token = Token(tokenAddress);
        
        uint256 currentPrice = getCurrentPrice(tokenAddress);
        uint256 ethAmount = (tokenAmount * currentPrice) / DECIMALS;
        require(ethAmount >= MIN_PURCHASE && ethAmount <= MAX_PURCHASE, "Invalid amount");

        uint256 fee = calculateFee(ethAmount);
        uint256 finalAmount = ethAmount - fee;
        
        require(
            token.balanceOf(msg.sender) >= tokenAmount,
            "Insufficient balance"
        );
        require(
            collateral[tokenAddress] >= ethAmount,
            "Insufficient token collateral"
        );

        token.factoryBurn(msg.sender, tokenAmount);
        virtualSupply[tokenAddress] -= tokenAmount;
        collateral[tokenAddress] -= ethAmount;
        lastPrice[tokenAddress] = currentPrice;

        (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        (bool success, ) = payable(msg.sender).call{value: finalAmount}("");
        require(success, "Transfer failed");

        emit TokensSold(tokenAddress, msg.sender, tokenAmount, ethAmount, fee);
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

    function getCurrentPrice(
        address tokenAddress
    ) public view returns (uint256) {
        uint256 currentSupply = virtualSupply[tokenAddress] - INITIAL_MINT;
        return
            INITIAL_PRICE +
            ((INITIAL_PRICE * currentSupply * PRICE_RATE) /
                (MAX_SUPPLY - INITIAL_MINT));
    }

    function calculateTokenAmount(
        address tokenAddress,
        uint256 ethAmount
    ) public view returns (uint256) {
        return (ethAmount * DECIMALS) / getCurrentPrice(tokenAddress);
    }

    function withdrawAll() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit EmergencyWithdrawal(msg.sender, balance);
    }

    // View functions
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
