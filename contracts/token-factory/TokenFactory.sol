//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "./Token.sol";
import "https://github.com/Uniswap/v2-core/blob/master/contracts/interfaces/IUniswapV2Factory.sol";
import "https://github.com/Uniswap/v2-periphery/blob/master/contracts/interfaces/IUniswapV2Router02.sol";
import "https://github.com/Uniswap/v2-core/blob/master/contracts/interfaces/IUniswapV2Pair.sol";


contract TokenFactory {

        enum TokenState {
            NOT_CREATED, ICO, TRADING
        }

    uint public constant DECIMALS = 10 ** 18;
    uint public constant MAX_SUPPLY = (10 ** 9) * DECIMALS;
    uint public constant INITIAL_MINT = (MAX_SUPPLY * 20) / 100;
    uint public constant k = 46875;
    uint public constant offset = 18750000000000000000000000000000;
    uint public constant SCALING_FACTOR = 10 ** 39;
    uint public constant FUNDING_GOAL = 30 ether;
    
    // // mainnet
    // address public UNISWAP_V2_FACTORY = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    // address public UNISWAP_V2_ROTUER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    // // avalanche
    // address public UNISWAP_V2_FACTORY = 0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C;
    // address public UNISWAP_V2_ROTUER = 0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24;

    //seoplia
    address public UNISWAP_V2_FACTORY = 0xF62c03E08ada871A0bEb309762E260a7a6a880E6;
    address public UNISWAP_V2_ROUTER = 0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3;
    

    mapping(address => TokenState) public tokens;
    mapping(address => uint) public collateral; //amount of ETH received for a token
    mapping(address => mapping(address => uint)) public balances; //funds not released yet

    

    function createToken(
        string memory name,
        string memory ticker
    ) external returns (address) {
        address initialOwner = msg.sender;
        Token token = new Token(initialOwner, name, ticker, INITIAL_MINT);
        tokens[address(token)] = TokenState.ICO;
        return address(token);
    }

    uint requiredSac = 1;

    function sacrifice () public payable{
        msg.value > requiredSac;
    }

    function buy(address tokenAddress, uint amount) external payable {
        require(tokens[tokenAddress] == TokenState.ICO, "Token doesn't exist or not avaiable for ICO.");
        Token token = Token(tokenAddress);
        uint availableSupply = MAX_SUPPLY - INITIAL_MINT - token.totalSupply();
        require(amount <= availableSupply, "Not enough available supply.");
        //calculate required eth to make purchase
        uint requiredEth = calculateRequiredEth(tokenAddress, amount);
        require(msg.value >= requiredEth, "Not enough ETH");
        collateral[tokenAddress] += requiredEth;
        balances[tokenAddress][msg.sender] += amount;
        token.mint(address(this), amount);

        if(collateral[tokenAddress] >= FUNDING_GOAL){
            // create liquidity pool
           address pool = _createLiquidityPool(tokenAddress);
            //provide liquidity
            uint liquidity = _provideLiquidity(tokenAddress, INITIAL_MINT, collateral[tokenAddress]);
            // burn LP
            _burnLpTokens(pool, liquidity);
        }
    }

    function calculateRequiredEth(
        address tokenAddress,
        uint amount
    ) public view returns (uint) {
        //amount eth = (b-a) * (f(a) + f(b) / 2)
        Token token = Token(tokenAddress);
        uint b = token.totalSupply() - INITIAL_MINT + amount;
        uint a = token.totalSupply() - INITIAL_MINT;
        uint f_a = k * a + offset;
        uint f_b = k * b + offset;
        return ((b - a) * (f_a + f_b)) / (2 * SCALING_FACTOR);
    }

    function _createLiquidityPool(address tokenAddress) internal returns (address){
        // Token token = Token(tokenAddress);
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

    function _burnLpTokens(address poolAddress, uint amount) internal {
            IUniswapV2Pair pool = IUniswapV2Pair(poolAddress);
            pool.transfer(address(0), amount);
    }

    function withdraw(address tokenAddress, address to) external {
        require(tokens[tokenAddress] == TokenState.TRADING, "Token doesn't exist or hasn't reached funding goal.");
        uint balance = balances[tokenAddress][msg.sender];
        require(balance > 0, "No tokens to withdraw."); // Ensure there is a balance to withdraw

        balances[tokenAddress][msg.sender] = 0; // Reset user balance
        Token token = Token(tokenAddress);

        // Ensure the contract has enough tokens before attempting transfer
        uint contractBalance = token.balanceOf(address(this));
        require(contractBalance >= balance, "Contract has insufficient tokens.");

        token.transfer(to, balance); // Transfer tokens to the specified address
    }

    function getTokenState(address tokenAddress) public view returns (TokenState) {
    return tokens[tokenAddress];
}


}
