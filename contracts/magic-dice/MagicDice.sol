pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Receiver.sol";

contract MagicDice is VRFConsumerBase, Ownable, ERC1155, ERC1155Receiver {
    event diceRolled(uint _lowBet, uint _highBet, uint _betAmount);
    event diceLanded(uint _rollResult);

    // Avalanche Fuji Testnet
    uint256 private chainlinkFee = 0.1 * 10 ** 18; // 0.1 LINK (Avalanche Fuji)
    bytes32 private keyHash =
        0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61; // Avalanche Fuji keyHash
    address VRFCoordinator = 0x2eD832Ba664535e5886b75D64C46EB9a228C2610; // Avalanche Fuji VRF Coordinator
    address linkAddress = 0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846; // Avalanche Fuji LINK token

    // Mumbai (OLD - COMMENTED)
    // uint256 private chainlinkFee = 0.001 * 10 ** 18; // 0.1 LINK (Polygon Mumbai)
    // bytes32 private keyHash = 0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4; //Polygon keyHash
    // address VRFCoordinator = 0x8C7382F9D8f56b33781fE506E897a4F1e2d17255; // Polygon testnet VRF
    // address linkAddress = 0x326C977E6efc84E512bB9C30f76E30c160eD06FB;  //Polygon testnet LINK

    // Rinkeby (OLD - COMMENTED)
    // uint256 private chainlinkFee = 0.1 * 10 ** 18;
    // bytes32 private keyHash = 0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311;
    // address VRFCoordinator = 0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B ;
    // address linkAddress = 0x01BE23585060835E02B77ef475b0Cc51aA1e0709;

    bytes32 internal requestId;
    uint32 lowBet;
    uint32 highBet;
    uint256 betAmount;
    uint public rollResult;
    uint256 public payout;
    bool public winner;
    uint256 public constant DICEPOINTS = 0; // <-- HOUSEPOINTS ID
    mapping(bytes32 => address) public payoutRequests;
    uint256 public totalRolls;

    constructor()
        ERC1155("")
        VRFConsumerBase(VRFCoordinator, linkAddress)
        Ownable(msg.sender)
    {
        // address payable owner = payable(msg.sender);
        _mint(address(this), DICEPOINTS, 1000 ether, "");
        // _mint(owner, DICEPOINTS, 1 ether, "");
    }

    function buyIn() public payable {
        require(msg.value >= .001 ether, "must send at least 1 finney");
        _setApprovalForAll(address(this), address(msg.sender), true);
        safeTransferFrom(address(this), msg.sender, 0, msg.value, "");
        _setApprovalForAll(address(this), address(msg.sender), false);
    }

    function roll(
        uint32 _lowBet,
        uint32 _highBet,
        uint256 _betAmount
    ) public returns (bytes32) {
        require(rollResult != 777, "Roll already in progress");
        require(
            LINK.balanceOf(address(this)) >= chainlinkFee,
            "Not enough LINK in contract!"
        );
        require(_lowBet > 10, "low bet must be higher than 10");
        require(
            _highBet >= _lowBet,
            "high bet must be greater than or equal to low bet"
        );
        require(_highBet <= 100, "high bet must be less than or equal to 100");
        // require(_betAmount >= .001 ether, "Bet amount at least 1 base DICEPOINTS");
        emit diceRolled(_lowBet, _highBet, _betAmount);
        totalRolls += 1;
        safeTransferFrom(msg.sender, address(this), 0, _betAmount, "");
        rollResult = 777;
        winner = false;
        payout = 0;
        lowBet = _lowBet;
        highBet = _highBet;
        betAmount = _betAmount;
        requestId = requestRandomness(keyHash, chainlinkFee);
        payoutRequests[requestId] = msg.sender;
        return requestId;
    }

    ///Called by the ChainlinkVRF once randomness has been generated
    function fulfillRandomness(bytes32, uint256 randomness) internal override {
        rollResult = (randomness % 100) + 1;
        emit diceLanded(rollResult);
        if (rollResult >= lowBet && rollResult <= highBet) {
            winner = true;
            payout = (10000 / (highBet * 100 - lowBet * 100)) * betAmount;
            _setApprovalForAll(address(this), address(VRFCoordinator), true);
            safeTransferFrom(
                address(this),
                payoutRequests[requestId],
                0,
                payout,
                ""
            );
            _setApprovalForAll(address(this), address(VRFCoordinator), false);
        }
    }

    //for payout math debugging
    function notRandomRoll(
        uint32 _lowBet,
        uint32 _highBet,
        uint256 _betAmount
    ) public onlyOwner {
        require(_betAmount >= .001 ether, "Bet amount at least 1 finney");
        emit diceRolled(777, 777, 777);
        winner = false;
        payout = 0;
        lowBet = _lowBet;
        highBet = _highBet;
        betAmount = _betAmount;
        uint256 randomness = _betAmount;
        rollResult = (randomness % 100) + 1;
        if (rollResult >= lowBet && rollResult <= highBet) {
            winner = true;
            payout = (100000 / (highBet * 1000 - lowBet * 1000)) * betAmount;
            _setApprovalForAll(address(this), msg.sender, true);
            safeTransferFrom(address(this), msg.sender, 0, payout, "");
            _setApprovalForAll(address(this), msg.sender, false);
        }
    }

    function withDrawBaseToken() public onlyOwner {
        payable(address(this)).transfer(address(this).balance);
    }

    function withdrawDicePoints(uint256 amount) public onlyOwner {
        safeTransferFrom(address(this), msg.sender, 0, amount, "");
    }

    function resetRoll() public onlyOwner {
        _setApprovalForAll(address(this), msg.sender, true);
        rollResult = 0;
    }

    function getLinkBalance() public view returns (uint256) {
        return LINK.balanceOf(address(this));
    }

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

    // Enhanced functions for better integration with your app

    function getCurrentRoll()
        public
        view
        returns (
            uint32 _lowBet,
            uint32 _highBet,
            uint256 _betAmount,
            uint _rollResult,
            uint256 _payout,
            bool _winner,
            bool _rollInProgress
        )
    {
        return (
            lowBet,
            highBet,
            betAmount,
            rollResult,
            payout,
            winner,
            rollResult == 777
        );
    }

    function getUserBalance(address user) public view returns (uint256) {
        return balanceOf(user, DICEPOINTS);
    }

    function getContractBalance() public view returns (uint256) {
        return balanceOf(address(this), DICEPOINTS);
    }

    function getWinProbability(
        uint32 _lowBet,
        uint32 _highBet
    ) public pure returns (uint256) {
        require(_lowBet <= _highBet, "Invalid bet range");
        require(
            _lowBet > 10 && _highBet <= 100,
            "Bet range must be between 11-100"
        );
        return _highBet - _lowBet + 1; // Returns percentage (11-90 = 80% chance)
    }

    function calculatePayout(
        uint32 _lowBet,
        uint32 _highBet,
        uint256 _betAmount
    ) public pure returns (uint256) {
        require(_lowBet <= _highBet, "Invalid bet range");
        require(
            _lowBet > 10 && _highBet <= 100,
            "Bet range must be between 11-100"
        );

        uint256 winChance = _highBet - _lowBet + 1;
        if (winChance == 0) return 0;

        return (10000 / (winChance * 100)) * _betAmount;
    }

    // Emergency functions
    function emergencyWithdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function emergencyWithdrawLink() public onlyOwner {
        LINK.transfer(owner(), LINK.balanceOf(address(this)));
    }

    // Allow contract to receive AVAX
    receive() external payable {}
}
