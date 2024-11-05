// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts@1.2.0/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts@1.2.0/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Receiver.sol";

contract MagicDiceV2 is VRFConsumerBaseV2Plus, ERC1155, ERC1155Receiver {
    event DiceRolled(
        uint256 requestId,
        uint32 lowBet,
        uint32 highBet,
        uint256 betAmount,
        address roller
    );
    event DiceLanded(uint256 requestId, uint256 rollResult);

    // Chainlink VRF V2+ settings
    address public vrfCoordinator = 0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE;
    bytes32 public keyHash =
        0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887;
    uint64 public subscriptionId =
        24915438184029020066046542738515064588751826918193183938224033441802731076774;
    uint32 public callbackGasLimit = 100000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;

    // Betting state
    struct Bet {
        uint32 lowBet;
        uint32 highBet;
        uint256 betAmount;
        address bettor;
        bool fulfilled;
        uint256 rollResult;
        bool winner;
        uint256 payout;
    }

    mapping(uint256 => Bet) public bets; // Request ID to Bet
    mapping(address => uint256[]) public userBets; // Address to array of Request IDs
    uint256 public totalRolls;
    uint256 public constant DICEPOINTS = 0; // Token ID for dice points

    constructor() VRFConsumerBaseV2Plus(vrfCoordinator) ERC1155("") {
        // Mint initial dice points to contract
        _mint(address(this), DICEPOINTS, 1000 ether, "");
    }

    // Allow users to buy into the game by getting dice points (ERC1155 token)
    function buyIn() public payable {
        require(msg.value >= .001 ether, "Must send at least 1 finney");
        _setApprovalForAll(address(this), msg.sender, true);
        safeTransferFrom(address(this), msg.sender, DICEPOINTS, msg.value, "");
        _setApprovalForAll(address(this), msg.sender, false);
    }

    // Function to place a bet and request randomness from Chainlink VRF
    function roll(
        uint32 _lowBet,
        uint32 _highBet,
        uint256 _betAmount
    ) public returns (uint256 requestId) {
        require(LINK.balanceOf(address(this)) >= 0, "Not enough LINK"); // Subscription covers the cost
        require(_lowBet >= 10 && _highBet <= 100, "Invalid bet range");
        require(
            _highBet >= _lowBet,
            "High bet must be greater or equal to low bet"
        );

        // Transfer bet amount to contract
        safeTransferFrom(msg.sender, address(this), DICEPOINTS, _betAmount, "");

        // Request randomness
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );

        // Store bet details
        bets[requestId] = Bet({
            lowBet: _lowBet,
            highBet: _highBet,
            betAmount: _betAmount,
            bettor: msg.sender,
            fulfilled: false,
            rollResult: 0,
            winner: false,
            payout: 0
        });

        // Store the request ID in the user's bet history
        userBets[msg.sender].push(requestId);

        totalRolls += 1;

        // Emit the event with requestId, bet details, and roller's address
        emit DiceRolled(requestId, _lowBet, _highBet, _betAmount, msg.sender);
        return requestId;
    }

    // Chainlink VRF callback function
    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] calldata _randomWords
    ) internal override {
        Bet storage bet = bets[_requestId];
        require(!bet.fulfilled, "Bet already fulfilled");

        uint256 rollResult = (_randomWords[0] % 100) + 1;
        bet.rollResult = rollResult;
        bet.fulfilled = true;

        if (rollResult >= bet.lowBet && rollResult <= bet.highBet) {
            bet.winner = true;
            bet.payout =
                (10000 / (bet.highBet * 100 - bet.lowBet * 100)) *
                bet.betAmount;

            // Transfer payout
            _setApprovalForAll(address(this), bet.bettor, true);
            safeTransferFrom(
                address(this),
                bet.bettor,
                DICEPOINTS,
                bet.payout,
                ""
            );
            _setApprovalForAll(address(this), bet.bettor, false);
        }

        emit DiceLanded(_requestId, rollResult);
    }

    // Allows the owner to withdraw Ether
    function withdrawEther() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    // Get all the request IDs for a specific user
    function getUserBets(address user) public view returns (uint256[] memory) {
        return userBets[user];
    }

    // Support ERC1155 interface
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
