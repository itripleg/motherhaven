// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./SacrificeToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TokenFactory is Ownable, ReentrancyGuard, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    enum TokenState {
        NOT_CREATED,
        TRADING,
        GOAL_REACHED,
        HALTED,
        RESUMED
    }

    struct TokenMetadata {
        string name;
        string symbol;
        string imageUrl;
        uint256 fundingGoal;
        uint256 createdAt;
    }

    // Constants
    uint256 public immutable _decimals;
    uint256 public immutable _maxSupply;
    uint256 public immutable _initialMint;
    uint256 public immutable _initialPrice;
    uint256 public immutable _minPurchase;
    uint256 public immutable _maxPurchase;
    uint256 public immutable _maxWalletPercentage;
    uint256 public immutable _priceRate;
    uint256 public _defaultFundingGoal;
    uint256 public constant TRADING_FEE = 30; // 0.3% = 30 basis points

    address public feeRecipient;

    // State variables
    address[] private allTokens;
    mapping(address => TokenState) public tokens;
    mapping(address => uint256) public collateral;
    mapping(address => address) public tokenCreators;
    mapping(address => uint256) public lastPrice;
    mapping(address => uint256) private _fundingGoals;
    mapping(address => TokenMetadata) public tokenMetadata;
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
    event MetadataUpdated(address indexed token, string imageUrl);

    modifier validToken(address tokenAddress) {
        require(
            tokens[tokenAddress] != TokenState.NOT_CREATED,
            "Invalid token"
        );
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        require(msg.sender != address(0), "Can't be zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);
        feeRecipient = initialOwner;

        _decimals = 10 ** 18;
        _maxSupply = (10 ** 9) * _decimals;
        _initialMint = (_maxSupply * 20) / 100;
        _defaultFundingGoal = 25 ether;
        _initialPrice = 0.00001 ether;
        _priceRate = 2000;
        _minPurchase = 0.001 ether;
        _maxPurchase = 50 ether;
        _maxWalletPercentage = 5;
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    function calculateFee(uint256 amount) public pure returns (uint256) {
        return (amount * TRADING_FEE) / 10000;
    }

    function createToken(
        string calldata name,
        string calldata symbol,
        string calldata imageUrl,
        address burnManager // Optional burn manager address
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
            _initialMint,
            burnManager
        );
        address tokenAddress = address(token);

        tokens[tokenAddress] = TokenState.TRADING;
        allTokens.push(tokenAddress);
        tokenCreators[tokenAddress] = msg.sender;
        lastPrice[tokenAddress] = _initialPrice;
        _fundingGoals[tokenAddress] = _defaultFundingGoal;
        virtualSupply[tokenAddress] = _initialMint;

        tokenMetadata[tokenAddress] = TokenMetadata({
            name: name,
            symbol: symbol,
            imageUrl: imageUrl,
            fundingGoal: _defaultFundingGoal,
            createdAt: block.timestamp
        });

        emit TokenCreated(
            tokenAddress,
            name,
            symbol,
            imageUrl,
            msg.sender,
            _defaultFundingGoal,
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
            msg.value >= _minPurchase && msg.value <= _maxPurchase,
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
            virtualSupply[tokenAddress] + tokensToMint <= _maxSupply,
            "Max supply"
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

        if (collateral[tokenAddress] >= _fundingGoals[tokenAddress]) {
            tokens[tokenAddress] = TokenState.GOAL_REACHED;
            emit TradingHalted(tokenAddress, _fundingGoals[tokenAddress]);
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

        Token token = Token(tokenAddress);
        require(
            token.balanceOf(msg.sender) >= tokenAmount,
            "Insufficient balance"
        );

        uint256 currentPrice = getCurrentPrice(tokenAddress);
        uint256 ethAmount = (tokenAmount * currentPrice) / _decimals;
        require(ethAmount > 0, "Too small");

        uint256 fee = calculateFee(ethAmount);
        uint256 finalAmount = ethAmount - fee;

        require(
            address(this).balance >= ethAmount,
            "Insufficient contract balance"
        );

        virtualSupply[tokenAddress] -= tokenAmount;
        token.factoryBurn(msg.sender, tokenAmount);
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
        uint256 currentSupply = virtualSupply[tokenAddress] - _initialMint;
        return
            _initialPrice +
            ((_initialPrice * currentSupply * _priceRate) /
                (_maxSupply - _initialMint));
    }

    function calculateTokenAmount(
        address tokenAddress,
        uint256 ethAmount
    ) public view returns (uint256) {
        return (ethAmount * _decimals) / getCurrentPrice(tokenAddress);
    }

    // View functions
    function getTokenState(address token) external view returns (TokenState) {
        return tokens[token];
    }

    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    function getFundingGoal(address token) external view returns (uint256) {
        return _fundingGoals[token];
    }

    function updateImageUrl(
        address tokenAddress,
        string calldata newImageUrl
    ) external {
        require(
            msg.sender == tokenCreators[tokenAddress] ||
                hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        require(bytes(imageUrl).length > 0, "Invalid image URL");

        tokenMetadata[tokenAddress].imageUrl = newImageUrl;
        emit MetadataUpdated(tokenAddress, newImageUrl);
    }
}
