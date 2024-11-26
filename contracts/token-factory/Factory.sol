// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./Token.sol";
import "https://github.com/Uniswap/v2-core/blob/master/contracts/interfaces/IUniswapV2Factory.sol";
import "https://github.com/Uniswap/v2-periphery/blob/master/contracts/interfaces/IUniswapV2Router02.sol";
import "https://github.com/Uniswap/v2-core/blob/master/contracts/interfaces/IUniswapV2Pair.sol";

contract TokenFactory {
    enum TokenState {
        NOT_CREATED,
        PLATFORM_TRADING,
        GOAL_REACHED
    }

    uint256 public constant DECIMALS = 10 ** 18;
    uint256 public constant MAX_SUPPLY = (10 ** 9) * DECIMALS; // 1,000,000,000 tokens
    uint256 public constant INITIAL_MINT = (MAX_SUPPLY * 20) / 100; // 20% of MAX_SUPPLY
    uint256 public constant FUNDING_GOAL = 500 ether; // 500 AVAX funding goal
    uint256 public constant INITIAL_PRICE = 0.001 ether; // Starting price in AVAX
    uint256 public constant PRICE_RATE = 500; // Adjustable rate multiplier - higher = steeper price increase

    address public immutable UNISWAP_V2_FACTORY;
    address public immutable UNISWAP_V2_ROUTER;
    // AVAX
    // 0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C , 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24

    address[] private allTokens;
    mapping(address => TokenState) private tokens;
    mapping(address => uint256) private collateral;
    mapping(address => address) private tokenCreators;

    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string ticker,
        address creator
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

    constructor(address factory, address router) {
        UNISWAP_V2_FACTORY = factory;
        UNISWAP_V2_ROUTER = router;
    }

    function createToken(
        string memory name,
        string memory ticker
    ) external returns (address) {
        Token token = new Token(address(this), name, ticker, INITIAL_MINT);
        address tokenAddress = address(token);

        tokens[tokenAddress] = TokenState.PLATFORM_TRADING;
        allTokens.push(tokenAddress);
        tokenCreators[tokenAddress] = msg.sender;

        emit TokenCreated(tokenAddress, name, ticker, msg.sender);
        return tokenAddress;
    }

    function buy(address tokenAddress) external payable {
        require(
            tokens[tokenAddress] == TokenState.PLATFORM_TRADING,
            "Token not trading on platform"
        );
        require(msg.value > 0, "Must send AVAX");

        Token token = Token(tokenAddress);
        uint256 tokensToMint = calculateTokenAmount(tokenAddress, msg.value);
        require(
            token.totalSupply() + tokensToMint <= MAX_SUPPLY,
            "Exceeds max supply"
        );

        collateral[tokenAddress] += msg.value;
        token.mint(msg.sender, tokensToMint);

        emit TokensPurchased(tokenAddress, msg.sender, tokensToMint, msg.value);

        if (collateral[tokenAddress] >= FUNDING_GOAL) {
            _haltTrading(tokenAddress);
        }
    }

    function sell(address tokenAddress, uint256 tokenAmount) external {
        require(
            tokens[tokenAddress] == TokenState.PLATFORM_TRADING,
            "Token not trading on platform"
        );

        Token token = Token(tokenAddress);
        require(
            token.balanceOf(msg.sender) >= tokenAmount,
            "Insufficient token balance"
        );

        uint256 currentPrice = getCurrentPrice(tokenAddress);
        uint256 ethAmount = (tokenAmount * currentPrice) / DECIMALS;
        require(ethAmount > 0, "Sell amount too small");

        token.burnFrom(msg.sender, tokenAmount);

        (bool success, ) = payable(msg.sender).call{value: ethAmount}("");
        require(success, "ETH transfer failed");

        emit TokensSold(tokenAddress, msg.sender, tokenAmount, ethAmount);
    }

    function getCurrentPrice(
        address tokenAddress
    ) public view returns (uint256) {
        Token token = Token(tokenAddress);
        uint256 currentSupply = token.totalSupply() - INITIAL_MINT;

        return
            INITIAL_PRICE +
            (INITIAL_PRICE * currentSupply * PRICE_RATE) /
            (MAX_SUPPLY - INITIAL_MINT);
    }

    function calculateTokenAmount(
        address tokenAddress,
        uint256 ethAmount
    ) public view returns (uint256) {
        uint256 currentPrice = getCurrentPrice(tokenAddress);
        return (ethAmount * DECIMALS) / currentPrice;
    }

    function _haltTrading(address tokenAddress) internal {
        tokens[tokenAddress] = TokenState.GOAL_REACHED;
        uint256 totalCollateral = collateral[tokenAddress];
        collateral[tokenAddress] = 0;

        emit TradingHalted(tokenAddress, totalCollateral);
    }

    // View functions
    function getTokenState(
        address tokenAddress
    ) external view returns (TokenState) {
        return tokens[tokenAddress];
    }

    function getCollateral(
        address tokenAddress
    ) external view returns (uint256) {
        return collateral[tokenAddress];
    }

    function getTokenCreator(
        address tokenAddress
    ) external view returns (address) {
        return tokenCreators[tokenAddress];
    }

    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    function getMinSellableTokens(
        address tokenAddress,
        uint256 ethAmount
    ) public view returns (uint256) {
        uint256 currentPrice = getCurrentPrice(tokenAddress);
        return (ethAmount * DECIMALS) / currentPrice;
    }
}
