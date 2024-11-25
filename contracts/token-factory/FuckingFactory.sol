// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./Token.sol";
import "https://github.com/Uniswap/v2-core/blob/master/contracts/interfaces/IUniswapV2Factory.sol";
import "https://github.com/Uniswap/v2-periphery/blob/master/contracts/interfaces/IUniswapV2Router02.sol";
import "https://github.com/Uniswap/v2-core/blob/master/contracts/interfaces/IUniswapV2Pair.sol";

contract TokenFactory {

    enum TokenState {
        NOT_CREATED, ICO, TRADING
    }

    uint256 public constant DECIMALS = 10 ** 18;
    uint256 public constant MAX_SUPPLY = (10 ** 9) * DECIMALS; // 1,000,000,000 tokens
    uint256 public constant INITIAL_MINT = (MAX_SUPPLY * 20) / 100; // 20% of MAX_SUPPLY
    uint256 public constant TARGET_PRICE = 1000 ether; // 1000 AVAX (assuming 1 AVAX = 1 ether)
    uint256 public constant FUNDING_GOAL = 30 ether; // Adjust as necessary

    // Sepolia addresses (replace with actual Avalanche addresses if needed)
    address public UNISWAP_V2_FACTORY = 0xF62c03E08ada871A0bEb309762E260a7a6a880E6;
    address public UNISWAP_V2_ROUTER = 0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3;

    // Stores all tokens created
    address[] private allTokens;

    // Mapping from token address to TokenState
    mapping(address => TokenState) private tokens;

    // Mapping from token address to collateral amount (ETH received)
    mapping(address => uint256) private collateral;

    // Mapping from token address to user address to token balance
    mapping(address => mapping(address => uint256)) private balances;

    // Mapping from token address to creator address
    mapping(address => address) private tokenCreators;

    // Create a new token; the factory is the owner, and records the creator (msg.sender)
    function createToken(
        string memory name,
        string memory ticker
    ) external returns (address) {
        address initialOwner = address(this); // Factory is the owner
        Token token = new Token(initialOwner, name, ticker, INITIAL_MINT);
        tokens[address(token)] = TokenState.ICO;
        allTokens.push(address(token));
        tokenCreators[address(token)] = msg.sender; // Record the creator for debugging
        return address(token);
    }

    // Users can buy tokens during the ICO
    function buy(address tokenAddress, uint amount) external payable {
        require(tokens[tokenAddress] == TokenState.ICO, "Token not available for ICO.");
        Token token = Token(tokenAddress);
        uint availableSupply = MAX_SUPPLY - token.totalSupply();
        require(amount <= availableSupply, "Not enough available supply.");

        // Calculate required ETH to make the purchase
        uint requiredEth = calculateRequiredEth(tokenAddress, amount);
        require(msg.value >= requiredEth, "Insufficient ETH sent.");

        // Update collateral and user balances
        collateral[tokenAddress] += requiredEth;
        balances[tokenAddress][msg.sender] += amount;

        // Mint tokens to the factory (since the factory is the owner)
        token.mint(address(this), amount);

        // Check if target price is reached
        if (getCurrentPrice(tokenAddress) >= TARGET_PRICE) {
            // Create liquidity pool and provide liquidity
            address pool = _createLiquidityPool(tokenAddress);
            uint liquidity = _provideLiquidity(tokenAddress, INITIAL_MINT, collateral[tokenAddress]);
            _burnLpTokens(pool, liquidity);

            // Update token state to TRADING
            tokens[tokenAddress] = TokenState.TRADING;
        }
    }


    function calculateRequiredEth(
        address tokenAddress,
        uint amount
    ) public view returns (uint) {
        Token token = Token(tokenAddress);
        uint256 totalTokensSold = token.totalSupply() - INITIAL_MINT; // Tokens sold during ICO (in wei)

        uint256 initialPrice = 0.001 ether; // P0 (in wei)
        uint256 finalPrice = 1000 ether;    // Pf (in wei)
        uint256 tokensForSale = MAX_SUPPLY - INITIAL_MINT; // Tokens available for sale (in wei)

        // Calculate the fraction of tokens sold and to be sold (scaled by 1e18 for precision)
        uint256 startFraction = (totalTokensSold * 1e18) / tokensForSale;
        uint256 endFraction = ((totalTokensSold + amount) * 1e18) / tokensForSale;

        // Calculate the start and end prices using the bonding curve
        uint256 startPrice = initialPrice + ((finalPrice - initialPrice) * startFraction) / 1e18;
        uint256 endPrice = initialPrice + ((finalPrice - initialPrice) * endFraction) / 1e18;

        // Calculate the total required ETH as the area under the price curve
        uint256 totalPrice = ((startPrice + endPrice) * amount) / (2 * 1e18);

        return totalPrice;
    }

    function getCurrentPrice(address tokenAddress) public view returns (uint) {
        Token token = Token(tokenAddress);
        uint256 totalTokensSold = token.totalSupply() - INITIAL_MINT; // Tokens sold during ICO (in wei)
        uint256 tokensForSale = MAX_SUPPLY - INITIAL_MINT; // Tokens available for sale (in wei)

        uint256 initialPrice = 0.001 ether; // P0 (in wei)
        uint256 finalPrice = 1000 ether;    // Pf (in wei)

        // Calculate the fraction of tokens sold (scaled by 1e18 for precision)
        uint256 fractionSold = (totalTokensSold * 1e18) / tokensForSale;

        // Calculate the current price using the bonding curve
        uint256 currentPrice = initialPrice + ((finalPrice - initialPrice) * fractionSold) / 1e18;

        return currentPrice;
    }



    // Once the target price is reached, deploy a liquidity pool with the collateral raised
    function _createLiquidityPool(address tokenAddress) internal returns (address) {
        IUniswapV2Factory factory = IUniswapV2Factory(UNISWAP_V2_FACTORY);
        IUniswapV2Router02 router = IUniswapV2Router02(UNISWAP_V2_ROUTER);
        address pair = factory.createPair(tokenAddress, router.WETH());
        return pair;
    }

    // Provide liquidity to the pool
    function _provideLiquidity(
        address tokenAddress,
        uint256 tokenAmount,
        uint256 ethAmount
    ) internal returns (uint256 liquidity) {
        Token token = Token(tokenAddress);
        token.approve(UNISWAP_V2_ROUTER, tokenAmount); // Approve router to spend tokens
        IUniswapV2Router02 router = IUniswapV2Router02(UNISWAP_V2_ROUTER);

        // Add liquidity and receive liquidity tokens
        (, , liquidity) = router.addLiquidityETH{value: ethAmount}(
            tokenAddress,           // Address of the token
            tokenAmount,            // Amount of tokens to add
            tokenAmount,            // Min amount of tokens (slippage protection)
            ethAmount,              // Min amount of ETH (slippage protection)
            address(this),          // Recipient of liquidity tokens
            block.timestamp         // Deadline for the transaction
        );
        collateral[tokenAddress] = 0;
        return liquidity;
    }

    // Burn the LP tokens to lock liquidity
    function _burnLpTokens(address poolAddress, uint256 amount) internal {
        IUniswapV2Pair pool = IUniswapV2Pair(poolAddress);
        pool.transfer(address(0), amount);
    }

    // Users can withdraw their tokens after the ICO is over
    function withdraw(address tokenAddress, address to) external {
        require(tokens[tokenAddress] == TokenState.TRADING, "Token not ready for withdrawal.");
        uint256 balance = balances[tokenAddress][msg.sender];
        require(balance > 0, "No tokens to withdraw.");

        balances[tokenAddress][msg.sender] = 0; // Reset user balance
        Token token = Token(tokenAddress);

        // Ensure the contract has enough tokens before attempting transfer
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance >= balance, "Contract has insufficient tokens.");

        token.transfer(to, balance); // Transfer tokens to the specified address
    }

    // Getter functions

    // Get the token state
    function getTokenState(address tokenAddress) public view returns (TokenState) {
        return tokens[tokenAddress];
    }

    // Get the collateral for a token
    function getCollateral(address tokenAddress) public view returns (uint256) {
        return collateral[tokenAddress];
    }

    // Get a user's balance for a token
    function getBalance(address tokenAddress, address user) public view returns (uint256) {
        return balances[tokenAddress][user];
    }

    // Get the creator of a token
    function getTokenCreator(address tokenAddress) public view returns (address) {
        return tokenCreators[tokenAddress];
    }

    // Get all tokens
    function getAllTokens() public view returns (address[] memory) {
        return allTokens;
    }
}
