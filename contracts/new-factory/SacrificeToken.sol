// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IBurnManager {
    function notifyBurn(address burner, uint256 amount) external;
    function supportsToken(address token) external view returns (bool);
}

contract Token is ERC20, Ownable {
    address public immutable tokenFactory;
    address public immutable creator;
    address public burnManager;
    string public imageUrl;

    event BurnManagerSet(
        address indexed oldManager,
        address indexed newManager
    );
    event TokensBurned(
        address indexed burner,
        uint256 amount,
        BurnType indexed burnType,
        uint256 newTotalSupply
    );
    event ImageUrlUpdated(string newImageUrl);

    enum BurnType {
        FACTORY,
        SELF
    }

    constructor(
        address initialOwner,
        address _creator,
        string memory name,
        string memory symbol,
        address _burnManager,
        string memory _imageUrl
    ) ERC20(name, symbol) Ownable(initialOwner) {
        require(bytes(_imageUrl).length > 0, "Invalid image URL");
        tokenFactory = initialOwner;
        creator = _creator;
        burnManager = _burnManager; // Can be address(0)
        imageUrl = _imageUrl;

        // If burnManager is set, validate it supports this token
        if (_burnManager != address(0)) {
            require(
                IBurnManager(_burnManager).supportsToken(address(this)),
                "Burn manager not compatible"
            );
        }
    }

    // Only factory can mint
    function mint(address to, uint256 amount) external {
        require(msg.sender == tokenFactory, "Only factory can mint");
        _mint(to, amount);
    }

    // Factory burn for bonding curve sells
    function factoryBurn(address from, uint256 amount) external {
        require(msg.sender == tokenFactory, "Only factory can factory burn");
        _burn(from, amount);
        emit TokensBurned(from, amount, BurnType.FACTORY, totalSupply());
    }

    // Any holder can self-burn their tokens if burn manager is set
    function burn(uint256 amount) public virtual {
        require(burnManager != address(0), "Self-burn not enabled");
        require(amount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount, BurnType.SELF, totalSupply());

        IBurnManager(burnManager).notifyBurn(msg.sender, amount);
    }

    // Only token creator can set/update burn manager
    function setBurnManager(address newManager) external {
        require(msg.sender == creator, "Only creator can set burn manager");
        require(newManager != address(0), "Cannot be zero address");
        require(
            IBurnManager(newManager).supportsToken(address(this)),
            "Burn manager not compatible"
        );

        address oldManager = burnManager;
        burnManager = newManager;
        emit BurnManagerSet(oldManager, newManager);
    }

    // Only token creator can update image URL
    function updateImageUrl(string calldata newImageUrl) external {
        require(msg.sender == creator, "Only creator can update image URL");
        require(bytes(newImageUrl).length > 0, "Invalid image URL");
        imageUrl = newImageUrl;
        emit ImageUrlUpdated(newImageUrl);
    }
}
