// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

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

    uint public constant DECIMALS = 10 ** 18;
    uint public constant MAX_SUPPLY = (10 ** 9) * DECIMALS;
    uint public constant INITIAL_MINT = (MAX_SUPPLY * 20) / 100; // 20% of max supply
    uint public constant FUNDING_GOAL = 30 ether;
    
    // Starting price is 0.001 AVAX per token
    uint public constant INITIAL_PRICE = 0.001 ether;
    
    // Simplified price curve: Linear increase from INITIAL_PRICE to reach FUNDING_GOAL at INITIAL_MINT
    uint public constant PRICE_SLOPE = (FUNDING_GOAL * DECIMALS) / (INITIAL_MINT ** 2);

    address public UNISWAP_V2_FACTORY = 0xF62c03E08ada871A0bEb309762E260a7a6a880E6;
    address public UNISWAP_V2_ROUTER = 0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3;

    address[] private allTokens;
    mapping(address => TokenState) private tokens;
    mapping(address => uint) private collateral;
    mapping(address => address) private tokenCreators;

    function createToken(
        string memory name,
        string memory ticker
    ) external returns (address) {
        Token token = new Token(address(this), name, ticker, INITIAL_MINT);
        tokens[address(token)] = TokenState.ICO;
        allTokens.push(address(token));
        tokenCreators[address(token)] = msg.sender;
        return address(token);
    }

    function buy(address tokenAddress) external payable {
        require(tokens[tokenAddress] == TokenState.ICO, "Token not in ICO state");
        Token token = Token(tokenAddress);
        
        uint currentSupply = token.totalSupply();
        require(currentSupply <= INITIAL_MINT, "All ICO tokens sold");

        uint ethSent = msg.value;
        require(ethSent > 0, "Must send ETH");

        // Calculate how many tokens the sent ETH can buy
        uint tokensToBuy = calculateTokenAmount(tokenAddress, ethSent);
        require(tokensToBuy > 0, "Amount too small");
        require(currentSupply + tokensToBuy <= INITIAL_MINT, "Would exceed ICO supply");

        // Transfer tokens from factory to buyer
        require(token.transfer(msg.sender, tokensToBuy), "Transfer failed");
        
        // Update collateral
        collateral[tokenAddress] += ethSent;

        // Check if ICO is complete
        if (token.totalSupply() >= INITIAL_MINT) {
            require(collateral[tokenAddress] >= FUNDING_GOAL, "Funding goal not reached");
            _finishICO(tokenAddress);
        }
    }

    function calculateTokenAmount(address tokenAddress, uint ethAmount) public view returns (uint) {
        Token token = Token(tokenAddress);
        uint currentSupply = token.totalSupply();
        
        // Calculate average price for this purchase using quadratic formula
        // price = INITIAL_PRICE + (PRICE_SLOPE * amount)
        uint currentPrice = getCurrentPrice(tokenAddress);
        
        // Simplified calculation: tokens = ethAmount / currentPrice
        return (ethAmount * DECIMALS) / currentPrice;
    }

    function getCurrentPrice(address tokenAddress) public view returns (uint) {
        Token token = Token(tokenAddress);
        uint currentSupply = token.totalSupply();
        
        // Linear price increase based on current supply
        // price = INITIAL_PRICE + (PRICE_SLOPE * currentSupply)
        return INITIAL_PRICE + ((PRICE_SLOPE * currentSupply) / DECIMALS);
    }

    function _finishICO(address tokenAddress) internal {
        // Create liquidity pool
        address pool = _createLiquidityPool(tokenAddress);
        
        // Provide all raised ETH and equivalent tokens as liquidity
        uint liquidity = _provideLiquidity(tokenAddress, INITIAL_MINT, collateral[tokenAddress]);
        
        // Lock liquidity by burning LP tokens
        _burnLpTokens(pool, liquidity);
        
        // Update state to TRADING
        tokens[tokenAddress] = TokenState.TRADING;
    }

    // [Rest of the contract functions remain the same...]
    function _createLiquidityPool(address tokenAddress) internal returns (address) {
        IUniswapV2Factory factory = IUniswapV2Factory(UNISWAP_V2_FACTORY);
        IUniswapV2Router02 router = IUniswapV2Router02(UNISWAP_V2_ROUTER);
        address pair = factory.createPair(tokenAddress, router.WETH());
        return pair;
    }

    function _provideLiquidity(
        address tokenAddress,
        uint tokenAmount,
        uint ethAmount
    ) internal returns (uint liquidity) {
        Token token = Token(tokenAddress);
        token.approve(UNISWAP_V2_ROUTER, tokenAmount);
        IUniswapV2Router02 router = IUniswapV2Router02(UNISWAP_V2_ROUTER);

        (, , liquidity) = router.addLiquidityETH{value: ethAmount}(
            tokenAddress,
            tokenAmount,
            tokenAmount,
            ethAmount,
            address(this),
            block.timestamp
        );
        collateral[tokenAddress] = 0;
        return liquidity;
    }

    function _burnLpTokens(address poolAddress, uint amount) internal {
        IUniswapV2Pair pool = IUniswapV2Pair(poolAddress);
        pool.transfer(address(0), amount);
    }

    // Getter functions
    function getTokenState(address tokenAddress) public view returns (TokenState) {
        return tokens[tokenAddress];
    }

    function getCollateral(address tokenAddress) public view returns (uint) {
        return collateral[tokenAddress];
    }

    function getTokenCreator(address tokenAddress) public view returns (address) {
        return tokenCreators[tokenAddress];
    }

    function getAllTokens() public view returns (address[] memory) {
        return allTokens;
    }
}