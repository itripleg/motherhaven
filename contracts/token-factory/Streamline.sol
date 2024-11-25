// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./Token.sol";
import "https://github.com/Uniswap/v2-core/blob/master/contracts/interfaces/IUniswapV2Factory.sol";
import "https://github.com/Uniswap/v2-periphery/blob/master/contracts/interfaces/IUniswapV2Router02.sol";
import "https://github.com/Uniswap/v2-core/blob/master/contracts/interfaces/IUniswapV2Pair.sol";

contract TokenFactory {
    enum TokenState {
        NOT_CREATED,
        ICO,
        TRADING
    }

    uint256 public constant DECIMALS = 10 ** 18;
    uint256 public constant MAX_SUPPLY = (10 ** 9) * DECIMALS; // 1,000,000,000 tokens
    uint256 public constant INITIAL_MINT = (MAX_SUPPLY * 20) / 100; // 20% of MAX_SUPPLY
    uint256 public constant FUNDING_GOAL = 1000 ether; // 1000 AVAX funding goal
    uint256 public constant INITIAL_PRICE = 0.001 ether; // Starting price in AVAX
    uint256 public constant PRICE_RATE = 100; // Adjustable rate multiplier - higher = steeper price increase

    // Avalanche mainnet addresses
    address public immutable UNISWAP_V2_FACTORY;
    address public immutable UNISWAP_V2_ROUTER;
    // 0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C , 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24

    // State variables
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
    event TradingStarted(address indexed token, uint256 liquidityAdded);
    event TokenPriceUpdate(
        address indexed token,
        uint256 currentSupply,
        uint256 currentPrice
    );

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

        tokens[tokenAddress] = TokenState.ICO;
        allTokens.push(tokenAddress);
        tokenCreators[tokenAddress] = msg.sender;

        emit TokenCreated(tokenAddress, name, ticker, msg.sender);
        return tokenAddress;
    }

    function buy(address tokenAddress) external payable {
        require(tokens[tokenAddress] == TokenState.ICO, "Token not in ICO");
        require(msg.value > 0, "Must send AVAX");

        Token token = Token(tokenAddress);
        uint256 tokensToMint = calculateTokenAmount(tokenAddress, msg.value);
        require(
            token.totalSupply() + tokensToMint <= MAX_SUPPLY,
            "Exceeds max supply"
        );

        // Update collateral
        collateral[tokenAddress] += msg.value;

        // Mint tokens directly to buyer
        token.mint(msg.sender, tokensToMint);

        emit TokensPurchased(tokenAddress, msg.sender, tokensToMint, msg.value);
        emit TokenPriceUpdate(
            tokenAddress,
            token.totalSupply(),
            getCurrentPrice(tokenAddress)
        );
        // Check if funding goal is reached
        if (collateral[tokenAddress] >= FUNDING_GOAL) {
            _startTrading(tokenAddress);
        }
    }

    function getCurrentPrice(
        address tokenAddress
    ) public view returns (uint256) {
        Token token = Token(tokenAddress);
        uint256 currentSupply = token.totalSupply() - INITIAL_MINT;

        // Price increases exponentially with supply and PRICE_RATE
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

    function _startTrading(address tokenAddress) internal {
        Token token = Token(tokenAddress);
        uint256 ethAmount = collateral[tokenAddress];

        // Create and provide liquidity
        address pair = IUniswapV2Factory(UNISWAP_V2_FACTORY).createPair(
            tokenAddress,
            IUniswapV2Router02(UNISWAP_V2_ROUTER).WETH()
        );

        // Approve router to spend tokens
        token.approve(UNISWAP_V2_ROUTER, INITIAL_MINT);

        // Add liquidity with 1% slippage protection
        uint256 minTokenAmount = (INITIAL_MINT * 99) / 100;
        uint256 minEthAmount = (ethAmount * 99) / 100;

        IUniswapV2Router02 router = IUniswapV2Router02(UNISWAP_V2_ROUTER);
        (, , uint256 liquidity) = router.addLiquidityETH{value: ethAmount}(
            tokenAddress,
            INITIAL_MINT,
            minTokenAmount,
            minEthAmount,
            address(0), // Burn LP tokens by sending to address(0)
            block.timestamp
        );

        // Update state
        tokens[tokenAddress] = TokenState.TRADING;
        collateral[tokenAddress] = 0;

        emit TradingStarted(tokenAddress, liquidity);
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

    // Helper function to estimate tokens received for a given ETH amount
    function estimateTokensForEth(
        address tokenAddress,
        uint256 ethAmount
    ) external view returns (uint256) {
        require(tokens[tokenAddress] == TokenState.ICO, "Token not in ICO");
        return calculateTokenAmount(tokenAddress, ethAmount);
    }

    // Helper function to estimate ETH needed for a desired token amount
    function estimateEthForTokens(
        address tokenAddress,
        uint256 tokenAmount
    ) external view returns (uint256) {
        require(tokens[tokenAddress] == TokenState.ICO, "Token not in ICO");
        uint256 currentPrice = getCurrentPrice(tokenAddress);
        return (tokenAmount * currentPrice) / DECIMALS;
    }
}
