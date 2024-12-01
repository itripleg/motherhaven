// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./Token.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "https://github.com/Uniswap/v2-core/blob/master/contracts/interfaces/IUniswapV2Factory.sol";
import "https://github.com/Uniswap/v2-periphery/blob/master/contracts/interfaces/IUniswapV2Router02.sol";

contract TokenFactory is Ownable, ReentrancyGuard, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    enum TokenState {
        NOT_CREATED,
        TRADING,
        GOAL_REACHED,
        HALTED
    }

    struct TokenMetadata {
        string name;
        string ticker;
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
    uint256 public immutable _tradeCooldown;
    uint256 public immutable _maxWalletPercentage;
    uint256 public immutable _priceRate;
    uint256 public _defaultFundingGoal;

    address public immutable UNISWAP_V2_FACTORY;
    address public immutable UNISWAP_V2_ROUTER;

    // State variables
    address[] private allTokens;
    mapping(address => TokenState) public tokens;
    mapping(address => uint256) public collateral;
    mapping(address => address) public tokenCreators;
    mapping(address => uint256) public lastTradeTime;
    mapping(address => mapping(address => uint256)) private userTokenBalance;
    mapping(address => bool) public whitelistedAddresses;
    mapping(address => uint256) public lastPrice;
    mapping(address => uint256) private _fundingGoals;
    mapping(address => TokenMetadata) public tokenMetadata;

    // Events
    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string ticker,
        string imageUrl,
        address creator,
        uint256 fundingGoal
    );
    event TokensPurchased(
        address indexed token,
        address indexed buyer,
        uint256 amount,
        uint256 price
    );
    event TokensSold(
        address indexed token,
        address indexed seller,
        uint256 tokenAmount,
        uint256 ethAmount
    );
    event TradingHalted(address indexed token, uint256 collateral);
    event EmergencyWithdraw(address indexed owner, uint256 amount);
    event PriceUpdated(address indexed token, uint256 newPrice);
    event WhitelistUpdated(address indexed account, bool status);
    event TokenStateUpdated(address indexed token, TokenState state);
    event MetadataUpdated(address indexed token, string imageUrl);
    event OwnershipRenounced(address owner);

    modifier validToken(address tokenAddress) {
        require(
            tokens[tokenAddress] != TokenState.NOT_CREATED,
            "Invalid token"
        );
        _;
    }

    constructor(
        address factory,
        address router,
        address initialOwner
    ) Ownable(initialOwner) {
        require(msg.sender != address(0), "Can't be zero address");
        UNISWAP_V2_FACTORY = factory;
        UNISWAP_V2_ROUTER = router;
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);

        _decimals = 10 ** 18;
        _maxSupply = (10 ** 9) * _decimals;
        _initialMint = (_maxSupply * 20) / 100;
        _defaultFundingGoal = 5 ether;
        _initialPrice = 0.001 ether;
        _priceRate = 2000;
        _minPurchase = 0.001 ether;
        _maxPurchase = 50 ether;
        _tradeCooldown = 1 minutes;
        _maxWalletPercentage = 5;
    }

    function createToken(
        string calldata name,
        string calldata ticker,
        string calldata imageUrl,
        uint256 customFundingGoal
    ) external returns (address) {
        require(
            bytes(name).length > 0 && bytes(name).length <= 32,
            "Invalid name"
        );
        require(
            bytes(ticker).length > 0 && bytes(ticker).length <= 8,
            "Invalid ticker"
        );
        require(bytes(imageUrl).length > 0, "Invalid image URL");

        uint256 fundingGoal = customFundingGoal > 0
            ? customFundingGoal
            : _defaultFundingGoal;
        Token token = new Token(address(this), name, ticker, _initialMint);
        address tokenAddress = address(token);

        tokens[tokenAddress] = TokenState.TRADING;
        allTokens.push(tokenAddress);
        tokenCreators[tokenAddress] = msg.sender;
        lastPrice[tokenAddress] = _initialPrice;
        _fundingGoals[tokenAddress] = fundingGoal;

        // Store metadata
        tokenMetadata[tokenAddress] = TokenMetadata({
            name: name,
            ticker: ticker,
            imageUrl: imageUrl,
            fundingGoal: fundingGoal,
            createdAt: block.timestamp
        });

        emit TokenCreated(
            tokenAddress,
            name,
            ticker,
            imageUrl,
            msg.sender,
            fundingGoal
        );
        return tokenAddress;
    }

    function buy(
        address tokenAddress
    ) external payable validToken(tokenAddress) {
        require(tokens[tokenAddress] == TokenState.TRADING, "Not trading");
        require(
            msg.value >= _minPurchase && msg.value <= _maxPurchase,
            "Invalid amount"
        );
        require(
            block.timestamp >= lastTradeTime[msg.sender] + _tradeCooldown,
            "Cooldown"
        );

        Token token = Token(tokenAddress);
        uint256 tokensToMint = calculateTokenAmount(tokenAddress, msg.value);
        require(token.totalSupply() + tokensToMint <= _maxSupply, "Max supply");

        uint256 newBalance = userTokenBalance[tokenAddress][msg.sender] +
            tokensToMint;
        require(
            newBalance <= (_maxSupply * _maxWalletPercentage) / 100,
            "Wallet limit"
        );

        uint256 newPrice = getCurrentPrice(tokenAddress);

        collateral[tokenAddress] += msg.value;
        token.mint(msg.sender, tokensToMint);
        userTokenBalance[tokenAddress][msg.sender] = newBalance;
        lastTradeTime[msg.sender] = block.timestamp;
        lastPrice[tokenAddress] = newPrice;

        emit TokensPurchased(tokenAddress, msg.sender, tokensToMint, msg.value);

        if (collateral[tokenAddress] >= _fundingGoals[tokenAddress]) {
            tokens[tokenAddress] = TokenState.GOAL_REACHED;
            emit TradingHalted(tokenAddress, _fundingGoals[tokenAddress]);
        }
    }

    function calculatePriceChange(
        uint256 oldPrice,
        uint256 newPrice
    ) internal pure returns (uint256) {
        if (oldPrice == 0) return 0;
        uint256 change = oldPrice > newPrice
            ? ((oldPrice - newPrice) * 100) / oldPrice
            : ((newPrice - oldPrice) * 100) / oldPrice;
        return change;
    }

    function sell(
        address tokenAddress,
        uint256 tokenAmount
    ) external nonReentrant validToken(tokenAddress) {
        require(tokens[tokenAddress] == TokenState.TRADING, "Not trading");
        require(
            block.timestamp >= lastTradeTime[msg.sender] + _tradeCooldown,
            "Cooldown"
        );
        require(tokenAmount > 0, "Amount must be > 0");

        Token token = Token(tokenAddress);
        require(token.balanceOf(msg.sender) >= tokenAmount, "Insufficient");

        uint256 currentPrice = getCurrentPrice(tokenAddress);
        uint256 ethAmount = (tokenAmount * currentPrice) / _decimals;
        require(ethAmount > 0, "Too small");
        require(
            address(this).balance >= ethAmount,
            "Insufficient contract balance"
        );

        // First perform the burn
        token.burnFrom(msg.sender, tokenAmount);

        // Then update state
        userTokenBalance[tokenAddress][msg.sender] -= tokenAmount;
        lastTradeTime[msg.sender] = block.timestamp;
        lastPrice[tokenAddress] = currentPrice;

        // Finally transfer ETH
        (bool success, ) = payable(msg.sender).call{value: ethAmount}("");
        require(success, "Transfer failed");

        emit TokensSold(tokenAddress, msg.sender, tokenAmount, ethAmount);
    }

    function getCurrentPrice(
        address tokenAddress
    ) public view returns (uint256) {
        Token token = Token(tokenAddress);
        uint256 currentSupply = token.totalSupply() - _initialMint;
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

    function isWhitelisted(address account) external view returns (bool) {
        return whitelistedAddresses[account];
    }

    function getFundingGoal(address token) external view returns (uint) {
        return _fundingGoals[token];
    }

    // Admin functions
    function updateWhitelist(
        address account,
        bool status
    ) external onlyRole(ADMIN_ROLE) {
        whitelistedAddresses[account] = status;
        emit WhitelistUpdated(account, status);
    }

    function withdraw() external nonReentrant onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    // Admin functions
    function setFundingGoal(
        address token,
        uint256 goal
    ) external onlyRole(ADMIN_ROLE) {
        _fundingGoals[token] = goal;
    }

    function getUserTokenBalance(
        address tokenAddress,
        address user
    ) external view returns (uint256) {
        return userTokenBalance[tokenAddress][user];
    }

    function getLastTradeTime(address user) external view returns (uint256) {
        return lastTradeTime[user];
    }

    // Ownership management
    function renounceOwnership() public override onlyOwner {
        super.renounceOwnership();
        emit OwnershipRenounced(owner());
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
        require(bytes(newImageUrl).length > 0, "Invalid image URL");

        tokenMetadata[tokenAddress].imageUrl = newImageUrl;
        emit MetadataUpdated(tokenAddress, newImageUrl);
    }

    // New function to get token metadata
    function getTokenMetadata(
        address tokenAddress
    )
        external
        view
        returns (
            string memory name,
            string memory ticker,
            string memory imageUrl,
            uint256 fundingGoal,
            uint256 createdAt
        )
    {
        TokenMetadata memory metadata = tokenMetadata[tokenAddress];
        return (
            metadata.name,
            metadata.ticker,
            metadata.imageUrl,
            metadata.fundingGoal,
            metadata.createdAt
        );
    }
}
