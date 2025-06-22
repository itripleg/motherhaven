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

    uint256 public immutable DECIMALS; //

    uint256 public immutable MAX_SUPPLY; //

    uint256 public immutable INITIAL_MINT; //

    uint256 public immutable INITIAL_PRICE; //

    uint256 public immutable MIN_PURCHASE; //

    uint256 public immutable MAX_PURCHASE; //

    uint256 public immutable MAX_WALLET_PERCENTAGE; //

    uint256 public immutable PRICE_RATE; //

    uint256 public constant TRADING_FEE = 30; // // 0.3% = 30 basis points

    uint256 public defaultFundingGoal; //

    address public feeRecipient; //

    // State variables

    address[] private allTokens; //

    mapping(address => TokenState) public tokens; //

    mapping(address => uint256) public collateral; //

    mapping(address => address) public tokenCreators; //

    mapping(address => uint256) public lastPrice; //

    mapping(address => uint256) private fundingGoals; //

    mapping(address => uint256) public virtualSupply; //

    // Events

    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        string imageUrl,
        address creator,
        uint256 fundingGoal,
        address burnManager
    ); //

    event TokensPurchased(
        address indexed token,
        address indexed buyer,
        uint256 amount,
        uint256 price,
        uint256 fee
    ); //

    event TokensSold(
        address indexed token,
        address indexed seller,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 fee
    ); //

    event TradingHalted(address indexed token, uint256 collateral); //

    event TradingResumed(address indexed token); //

    event FeeRecipientUpdated(
        address indexed oldRecipient,
        address indexed newRecipient
    ); //

    event DefaultFundingGoalUpdated(uint256 oldGoal, uint256 newGoal); //

    event TokenFundingGoalUpdated(
        address indexed token,
        uint256 oldGoal,
        uint256 newGoal
    ); //

    event EmergencyWithdrawal(address indexed owner, uint256 amount); //

    modifier validToken(address tokenAddress) {
        require(
            tokens[tokenAddress] != TokenState.NOT_CREATED,
            "Invalid token"
        ); //

        _; //
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        require(initialOwner != address(0), "Can't be zero address"); //

        feeRecipient = initialOwner; //

        DECIMALS = 10 ** 18; //

        MAX_SUPPLY = (10 ** 9) * DECIMALS; //

        INITIAL_MINT = (MAX_SUPPLY * 20) / 100; //

        defaultFundingGoal = 25 ether; //

        INITIAL_PRICE = 0.00001 ether; //

        PRICE_RATE = 2000; //

        MIN_PURCHASE = INITIAL_PRICE; //

        MAX_PURCHASE = 50 ether; //

        MAX_WALLET_PERCENTAGE = 5; //
    }

    // --- Core Functions (Unchanged) ---

    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address"); //

        address oldRecipient = feeRecipient; //

        feeRecipient = newRecipient; //

        emit FeeRecipientUpdated(oldRecipient, newRecipient); //
    }

    function setDefaultFundingGoal(uint256 newGoal) external onlyOwner {
        require(newGoal > 0, "Invalid funding goal"); //

        uint256 oldGoal = defaultFundingGoal; //

        defaultFundingGoal = newGoal; //

        emit DefaultFundingGoalUpdated(oldGoal, newGoal); //
    }

    function setTokenFundingGoal(
        address tokenAddress,
        uint256 newGoal
    ) external onlyOwner validToken(tokenAddress) {
        require(newGoal > 0, "Invalid funding goal"); //

        require(
            tokens[tokenAddress] == TokenState.TRADING ||
                tokens[tokenAddress] == TokenState.RESUMED,
            "Token not in valid state"
        ); //

        require(
            collateral[tokenAddress] < fundingGoals[tokenAddress],
            "Goal already reached"
        ); //

        uint256 oldGoal = fundingGoals[tokenAddress]; //

        fundingGoals[tokenAddress] = newGoal;

        emit TokenFundingGoalUpdated(tokenAddress, oldGoal, newGoal); //

        if (collateral[tokenAddress] >= newGoal) {
            tokens[tokenAddress] = TokenState.GOAL_REACHED; //

            emit TradingHalted(tokenAddress, newGoal); //
        }
    }

    // --- Price Calculation Logic ---

    function calculateFee(uint256 amount) public pure returns (uint256) {
        return (amount * TRADING_FEE) / 10000; //
    }

    function _calculatePrice(
        uint256 effectiveSupplyStart,
        uint256 effectiveSupplyEnd
    ) internal view returns (uint256) {
        uint256 supplyRange = MAX_SUPPLY - INITIAL_MINT;

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

        uint256 costDenominator = 2 * supplyRange;

        return costNumerator / costDenominator;
    }

    function calculateBuyPrice(
        address tokenAddress,
        uint256 tokenAmount
    ) public view returns (uint256) {
        uint256 effectiveSupplyStart = virtualSupply[tokenAddress] -
            INITIAL_MINT;

        uint256 effectiveSupplyEnd = effectiveSupplyStart + tokenAmount;

        return _calculatePrice(effectiveSupplyStart, effectiveSupplyEnd);
    }

    function calculateSellPrice(
        address tokenAddress,
        uint256 tokenAmount
    ) public view returns (uint256) {
        uint256 effectiveSupplyStart = virtualSupply[tokenAddress] -
            INITIAL_MINT;

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

    // --- State-Changing Functions ---

    function createToken(
        string calldata name,
        string calldata symbol,
        string calldata imageUrl,
        address burnManager
    ) external returns (address) {
        require(
            bytes(name).length > 0 && bytes(name).length <= 32,
            "Invalid name"
        ); //

        require(
            bytes(symbol).length > 0 && bytes(symbol).length <= 8,
            "Invalid symbol"
        ); //

        require(bytes(imageUrl).length > 0, "Invalid image URL"); //

        Token token = new Token(
            address(this),
            msg.sender,
            name,
            symbol,
            imageUrl,
            burnManager
        ); //

        address tokenAddress = address(token); //

        tokens[tokenAddress] = TokenState.TRADING; //

        allTokens.push(tokenAddress); //

        tokenCreators[tokenAddress] = msg.sender; //

        lastPrice[tokenAddress] = INITIAL_PRICE; //

        fundingGoals[tokenAddress] = defaultFundingGoal; //

        virtualSupply[tokenAddress] = INITIAL_MINT; //

        emit TokenCreated(
            tokenAddress,
            name,
            symbol,
            imageUrl,
            msg.sender,
            defaultFundingGoal,
            burnManager
        ); //

        return tokenAddress; //
    }

    function buy(
        address tokenAddress
    ) external payable nonReentrant validToken(tokenAddress) {
        require(
            tokens[tokenAddress] == TokenState.TRADING ||
                tokens[tokenAddress] == TokenState.RESUMED,
            "Not trading"
        ); //

        require(
            msg.value >= MIN_PURCHASE && msg.value <= MAX_PURCHASE,
            "Invalid amount"
        ); //

        uint256 fee = calculateFee(msg.value);

        uint256 purchaseAmount = msg.value - fee;

        uint256 tokensToMint = calculateTokenAmount(
            tokenAddress,
            purchaseAmount
        );

        require(tokensToMint > 0, "ETH amount too low to buy any tokens");

        Token token = Token(tokenAddress); //

        require(
            virtualSupply[tokenAddress] + tokensToMint <= MAX_SUPPLY,
            "Max supply"
        ); //

        uint256 newBalance = token.balanceOf(msg.sender) + tokensToMint; //

        require(
            newBalance <= (MAX_SUPPLY * MAX_WALLET_PERCENTAGE) / 100,
            "Exceeds max wallet"
        ); //

        (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");

        require(feeSuccess, "Fee transfer failed");

        virtualSupply[tokenAddress] += tokensToMint; //

        token.mint(msg.sender, tokensToMint); //

        collateral[tokenAddress] += purchaseAmount; //

        lastPrice[tokenAddress] = (purchaseAmount * DECIMALS) / tokensToMint; // Store average price

        emit TokensPurchased(
            tokenAddress,
            msg.sender,
            tokensToMint,
            msg.value,
            fee
        ); //

        if (collateral[tokenAddress] >= fundingGoals[tokenAddress]) {
            tokens[tokenAddress] = TokenState.GOAL_REACHED; //

            emit TradingHalted(tokenAddress, fundingGoals[tokenAddress]); //
        }
    }

    /**
     * @dev [REVISED] Updated sell function with correct collateral accounting.
     */
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
        require(
            token.balanceOf(msg.sender) >= tokenAmount,
            "Insufficient balance"
        );

        // grossAmount is the total ETH value of the tokens before fees.
        uint256 grossAmount = calculateSellPrice(tokenAddress, tokenAmount);
        uint256 fee = calculateFee(grossAmount);
        uint256 netAmountToReceive = grossAmount - fee;

        // --- FIX START ---

        // CORRECT: The collateral must be sufficient to cover the ENTIRE gross amount.
        require(
            collateral[tokenAddress] >= grossAmount,
            "Insufficient token collateral"
        );

        token.factoryBurn(msg.sender, tokenAmount);
        virtualSupply[tokenAddress] -= tokenAmount;

        // CORRECT: The collateral is reduced by the ENTIRE gross amount paid out.
        collateral[tokenAddress] -= grossAmount;

        // --- FIX END ---

        lastPrice[tokenAddress] = (grossAmount * DECIMALS) / tokenAmount; // Store average price

        // Send fee to recipient
        (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        // Send net amount to seller
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
        require(msg.sender == tokenCreators[tokenAddress], "Not token creator"); //

        require(
            tokens[tokenAddress] == TokenState.GOAL_REACHED,
            "Not ready to resume"
        ); //

        tokens[tokenAddress] = TokenState.RESUMED; //

        emit TradingResumed(tokenAddress); //
    }

    function withdrawAll() external onlyOwner {
        uint256 balance = address(this).balance; //

        require(balance > 0, "No balance to withdraw"); //

        (bool success, ) = payable(msg.sender).call{value: balance}(""); //

        require(success, "Withdrawal failed"); //

        emit EmergencyWithdrawal(msg.sender, balance); //
    }

    // --- View Functions ---

    function getTokenState(address token) external view returns (TokenState) {
        return tokens[token]; //
    }

    function getAllTokens() external view returns (address[] memory) {
        return allTokens; //
    }

    function getFundingGoal(address token) external view returns (uint256) {
        return fundingGoals[token]; //
    }
}
