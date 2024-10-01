pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Receiver.sol";

contract MagicDice is VRFConsumerBase, Ownable, ERC1155, ERC1155Receiver {
    // Events
    event DiceRolled(
        bytes32 indexed requestId,
        uint32 lowBet,
        uint32 highBet,
        uint256 betAmount
    );
    event DiceLanded(
        bytes32 indexed requestId,
        uint256 rollResult,
        uint256 payout
    );

    // Chainlink VRF Variables
    uint256 private chainlinkFee = 0.1 * 10 ** 18;
    bytes32 private keyHash =
        0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887;
    address VRFCoordinator = 0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE;
    address linkAddress = 0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846;

    // ERC1155 Token Variables
    uint256 public constant DICEPOINTS = 0; // Token ID for DICEPOINTS

    // Struct to store bet details
    struct Bet {
        uint32 lowBet;
        uint32 highBet;
        uint256 betAmount;
        bool resolved;
        uint256 payout;
    }

    // Mappings
    mapping(bytes32 => address) public payoutRequests; // Maps requestId to player address
    mapping(bytes32 => Bet) public bets; // Maps requestId to Bet details

    // Constructor
    constructor() ERC1155("") VRFConsumerBase(VRFCoordinator, linkAddress) {
        _mint(address(this), DICEPOINTS, 1000 ether, ""); // Mint initial DICEPOINTS to the contract
    }

    // Function to buy DICEPOINTS
    function buyIn() public payable {
        require(msg.value >= 0.001 ether, "Minimum buy-in is 0.001 ether");
        _setApprovalForAll(address(this), msg.sender, true);
        safeTransferFrom(address(this), msg.sender, DICEPOINTS, msg.value, "");
        _setApprovalForAll(address(this), msg.sender, false);
    }

    // Function to place a bet and roll the dice
    function roll(
        uint32 _lowBet,
        uint32 _highBet,
        uint256 _betAmount
    ) public returns (bytes32) {
        // Input validations
        require(
            LINK.balanceOf(address(this)) >= chainlinkFee,
            "Not enough LINK in contract"
        );
        require(
            _lowBet >= 1 && _lowBet <= 100,
            "lowBet must be between 1 and 100"
        );
        require(
            _highBet >= _lowBet && _highBet <= 100,
            "highBet must be between lowBet and 100"
        );
        require(
            _betAmount >= 0.001 ether,
            "Bet amount must be at least 0.001 ether"
        );

        // Transfer DICEPOINTS from player to contract
        safeTransferFrom(msg.sender, address(this), DICEPOINTS, _betAmount, "");

        // Request random number from Chainlink VRF
        bytes32 requestId = requestRandomness(keyHash, chainlinkFee);

        // Store bet details
        payoutRequests[requestId] = msg.sender;
        bets[requestId] = Bet(_lowBet, _highBet, _betAmount, false, 0);

        // Emit event
        emit DiceRolled(requestId, _lowBet, _highBet, _betAmount);

        return requestId;
    }

    // Callback function used by Chainlink VRF Coordinator
    function fulfillRandomness(
        bytes32 requestId,
        uint256 randomness
    ) internal override {
        Bet storage bet = bets[requestId];
        require(!bet.resolved, "Bet already resolved");

        // Calculate roll result between 1 and 100
        uint256 rollResult = (randomness % 100) + 1;

        address player = payoutRequests[requestId];
        bool isWinner = rollResult >= bet.lowBet && rollResult <= bet.highBet;

        uint256 payout = 0;
        if (isWinner) {
            // Calculate payout based on odds
            payout = (bet.betAmount * 100) / (bet.highBet - bet.lowBet + 1);
            // Transfer winnings to player
            safeTransferFrom(address(this), player, DICEPOINTS, payout, "");
            bet.payout = payout;
        }

        bet.resolved = true;

        // Emit event with the result
        emit DiceLanded(requestId, rollResult, payout);
    }

    // Function for the owner to withdraw Ether from the contract
    function withdrawEther(uint256 amount) public onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
    }

    // Function for the owner to withdraw DICEPOINTS from the contract
    function withdrawDicePoints(uint256 amount) public onlyOwner {
        safeTransferFrom(address(this), msg.sender, DICEPOINTS, amount, "");
    }

    // Function to get the LINK token balance of the contract
    function getLinkBalance() public view returns (uint256) {
        return LINK.balanceOf(address(this));
    }

    // Override functions to support ERC1155Receiver
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155, ERC1155Receiver) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
