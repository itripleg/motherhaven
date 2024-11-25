// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "remix_tests.sol"; // Import the Remix testing library
import "../token-factory/contracts/TokenFactory.sol"; // Adjust the path to your TokenFactory contract
import "../token-factory/contracts/Token.sol"; // Adjust the path to your Token contract

contract TokenFactoryTest {
    TokenFactory factory;
    Token token;
    address tokenAddress;
    address owner = address(this); // Test contract will act as the owner
    address user1 = address(0x1);
    address user2 = address(0x2);

    uint256 initialUserBalance = 1000 ether; // Initial balance for test accounts

    // Set up before each test
    function beforeEach() public {
        // Deploy a new TokenFactory instance
        factory = new TokenFactory();

        // Create a new token via the factory
        tokenAddress = factory.createToken("TestToken", "TTK");
        token = Token(tokenAddress);

        // Fund test accounts with ETH
        // Note: In Solidity unit tests, accounts are pre-funded
    }

    /// @dev Fallback function to receive Ether
    receive() external payable {}

    /// @dev Helper function to send Ether to test accounts
    // function fundAccount(address account, uint256 amount) internal {
    //     payable(account).transfer(amount);
    // }

    // Test token creation
    function testTokenCreation() public {
        // Verify token has correct name and symbol
        Assert.equal(token.name(), "TestToken", "Token name should be 'TestToken'");
        Assert.equal(token.symbol(), "TTK", "Token symbol should be 'TTK'");

        // Verify initial mint (20% of MAX_SUPPLY)
        uint256 expectedInitialMint = (factory.MAX_SUPPLY() * 20) / 100;
        Assert.equal(token.totalSupply(), expectedInitialMint, "Initial mint should be 20% of MAX_SUPPLY");

        // Verify factory is the owner of the token
        Assert.equal(token.owner(), address(factory), "Factory should be the owner of the token");

        // Verify token state is ICO
        Assert.equal(uint(factory.getTokenState(tokenAddress)), uint(TokenFactory.TokenState.ICO), "Token state should be ICO");

        // Verify token creator is recorded
        Assert.equal(factory.getTokenCreator(tokenAddress), owner, "Token creator should be the test contract");
    }

    // Test buying tokens with correct ETH amount
    function testTokenPurchase() public payable {
        uint256 amountToBuy = 1000 * 1e18; // Buying 1000 tokens
        uint256 requiredEth = factory.calculateRequiredEth(tokenAddress, amountToBuy);

        // Simulate buying tokens by sending ETH to the buy function
        (bool success, ) = address(factory).call{value: requiredEth}(
            abi.encodeWithSignature("buy(address,uint256)", tokenAddress, amountToBuy)
        );
        Assert.ok(success, "Token purchase should succeed");

        // Verify user's balance in the factory
        uint256 userBalance = factory.getBalance(tokenAddress, address(this));
        Assert.equal(userBalance, amountToBuy, "User balance should be updated");

        // Verify collateral updated
        uint256 collateralAmount = factory.getCollateral(tokenAddress);
        Assert.equal(collateralAmount, requiredEth, "Collateral should be updated");

        // Verify token total supply increased
        uint256 expectedSupply = ((factory.MAX_SUPPLY() * 20) / 100) + amountToBuy;
        Assert.equal(token.totalSupply(), expectedSupply, "Token total supply should increase");

        // Verify current price increased
        uint256 currentPrice = factory.getCurrentPrice(tokenAddress);
        Assert.isAbove(currentPrice, 0.001 ether, "Current price should have increased");
    }

    // Test buying tokens with insufficient ETH (should revert)
    function testTokenPurchaseInsufficientEth() public {
        uint256 amountToBuy = 1000 * 1e18; // Buying 1000 tokens
        uint256 requiredEth = factory.calculateRequiredEth(tokenAddress, amountToBuy);
        uint256 insufficientEth = requiredEth - 1 wei;

        // Attempt to buy with insufficient ETH
        (bool success, ) = address(factory).call{value: insufficientEth}(
            abi.encodeWithSignature("buy(address,uint256)", tokenAddress, amountToBuy)
        );
        Assert.isFalse(success, "Token purchase should fail with insufficient ETH");
    }

    // Test buying more tokens than available (should revert)
    function testTokenPurchaseExceedingSupply() public {
        uint256 availableSupply = factory.MAX_SUPPLY() - token.totalSupply();
        uint256 amountToBuy = availableSupply + 1; // Attempting to buy more than available

        uint256 requiredEth = factory.calculateRequiredEth(tokenAddress, amountToBuy);

        // Attempt to buy more tokens than available
        (bool success, ) = address(factory).call{value: requiredEth}(
            abi.encodeWithSignature("buy(address,uint256)", tokenAddress, amountToBuy)
        );
        Assert.isFalse(success, "Token purchase should fail when exceeding available supply");
    }

    // Test withdrawing tokens before ICO ends (should revert if ICO not ended)
    function testWithdrawTokensBeforeICOEnds() public {
        // Attempt to withdraw tokens before ICO ends
        (bool success, ) = address(factory).call(
            abi.encodeWithSignature("withdraw(address,address)", tokenAddress, address(this))
        );
        Assert.isFalse(success, "Withdrawal should fail before ICO ends");
    }

    // Simulate reaching target price and transitioning to TRADING state
    function testTransitionToTradingState() public payable {
        // Simulate buying tokens until target price is reached
        uint256 amountToBuy = factory.MAX_SUPPLY() - token.totalSupply(); // Buy remaining tokens
        uint256 requiredEth = factory.calculateRequiredEth(tokenAddress, amountToBuy);

        // Buy tokens to reach target price
        (bool success, ) = address(factory).call{value: requiredEth}(
            abi.encodeWithSignature("buy(address,uint256)", tokenAddress, amountToBuy)
        );
        Assert.ok(success, "Token purchase should succeed to reach target price");

        // Verify token state is now TRADING
        Assert.equal(uint(factory.getTokenState(tokenAddress)), uint(TokenFactory.TokenState.TRADING), "Token state should be TRADING");

        // Attempt to withdraw tokens after ICO ends
        (success, ) = address(factory).call(
            abi.encodeWithSignature("withdraw(address,address)", tokenAddress, address(this))
        );
        Assert.ok(success, "Withdrawal should succeed after ICO ends");

        // Verify user's token balance
        uint256 userTokenBalance = token.balanceOf(address(this));
        Assert.isAbove(userTokenBalance, 0, "User should have withdrawn tokens");
    }

    // Test buying tokens when token is not in ICO state (should revert)
    function testBuyTokensAfterICOEnded() public payable {
        // First, transition to TRADING state
        uint256 amountToBuy = factory.MAX_SUPPLY() - token.totalSupply(); // Buy remaining tokens
        uint256 requiredEth = factory.calculateRequiredEth(tokenAddress, amountToBuy);
        (bool success, ) = address(factory).call{value: requiredEth}(
            abi.encodeWithSignature("buy(address,uint256)", tokenAddress, amountToBuy)
        );
        Assert.ok(success, "Token purchase should succeed to reach target price");

        // Now, attempt to buy tokens after ICO has ended
        amountToBuy = 1000 * 1e18; // Attempt to buy additional tokens
        requiredEth = factory.calculateRequiredEth(tokenAddress, amountToBuy);

        (success, ) = address(factory).call{value: requiredEth}(
            abi.encodeWithSignature("buy(address,uint256)", tokenAddress, amountToBuy)
        );
        Assert.isFalse(success, "Token purchase should fail after ICO has ended");
    }

    // Test that factory cannot mint tokens beyond MAX_SUPPLY
    function testMintBeyondMaxSupply() public {
        // Attempt to mint tokens beyond MAX_SUPPLY
        uint256 amountToBuy = (factory.MAX_SUPPLY() - token.totalSupply()) + 1;
        uint256 requiredEth = factory.calculateRequiredEth(tokenAddress, amountToBuy);

        (bool success, ) = address(factory).call{value: requiredEth}(
            abi.encodeWithSignature("buy(address,uint256)", tokenAddress, amountToBuy)
        );
        Assert.isFalse(success, "Minting beyond MAX_SUPPLY should fail");
    }
}
