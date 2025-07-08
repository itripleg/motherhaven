// contracts/BurnToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IBurnManager {
    function notifyBurn(address burner, uint256 amount) external;
    function supportsToken(address token) external view returns (bool);
}

contract BurnToken is ERC20, Ownable {
    address public immutable tokenFactory;
    address public immutable creator;
    string public imageUrl;
    string public description;
    address public burnManager;

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
    event ImageUrlUpdated(
        string indexed oldImageUrl,
        string indexed newImageUrl
    );
    event DescriptionUpdated(string oldDescription, string newDescription);

    enum BurnType {
        FACTORY,
        SELF
    }

    constructor(
        address initialOwner,
        address _creator,
        string memory name,
        string memory symbol,
        string memory _imageUrl,
        address _burnManager // can be set optionally by creator for experimental actions
    ) ERC20(name, symbol) Ownable(initialOwner) {
        require(initialOwner != address(0), "Invalid factory address");
        require(_creator != address(0), "Invalid creator address");

        tokenFactory = initialOwner;
        creator = _creator;
        imageUrl = _imageUrl;
        description = ""; // Initialize as empty string

        if (_burnManager != address(0)) {
            require(
                IBurnManager(_burnManager).supportsToken(address(this)),
                "Burn manager not compatible"
            );
            burnManager = _burnManager;
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

    // Any holder can self-burn their tokens
    function burn(uint256 amount) public virtual {
        require(amount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount, BurnType.SELF, totalSupply());

        if (burnManager != address(0)) {
            IBurnManager(burnManager).notifyBurn(msg.sender, amount);
        }
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

    // Only token creator can update image URL (useful for IPFS updates or adding image later)
    function updateImageUrl(string calldata newImageUrl) external {
        require(msg.sender == creator, "Only creator can update image");

        string memory oldImageUrl = imageUrl;
        imageUrl = newImageUrl;
        emit ImageUrlUpdated(oldImageUrl, newImageUrl);
    }

    // Only token creator can update description
    function updateDescription(string calldata newDescription) external {
        require(msg.sender == creator, "Only creator can update description");

        string memory oldDescription = description;
        description = newDescription;
        emit DescriptionUpdated(oldDescription, newDescription);
    }

    // Helper function to check if image URL is an IPFS hash
    function isIpfsHash() external view returns (bool) {
        return bytes(imageUrl).length > 0 && _isIpfsHash(imageUrl);
    }

    // Helper function to get IPFS hash from URL (if applicable)
    function getIpfsHash() external view returns (string memory) {
        if (bytes(imageUrl).length == 0) {
            return ""; // No image URL set
        }

        if (_isIpfsHash(imageUrl)) {
            return imageUrl;
        }

        // Check if it's a gateway URL and extract hash
        bytes memory urlBytes = bytes(imageUrl);
        bytes memory ipfsPrefix = bytes("ipfs/");

        if (urlBytes.length > ipfsPrefix.length) {
            bool foundPrefix = true;
            uint256 prefixStart = 0;

            // Find "ipfs/" in the URL
            for (uint256 i = 0; i <= urlBytes.length - ipfsPrefix.length; i++) {
                bool matches = true;
                for (uint256 j = 0; j < ipfsPrefix.length; j++) {
                    if (urlBytes[i + j] != ipfsPrefix[j]) {
                        matches = false;
                        break;
                    }
                }
                if (matches) {
                    prefixStart = i + ipfsPrefix.length;
                    foundPrefix = true;
                    break;
                }
            }

            if (foundPrefix && prefixStart < urlBytes.length) {
                // Extract hash after "ipfs/"
                bytes memory hash = new bytes(urlBytes.length - prefixStart);
                for (uint256 i = 0; i < hash.length; i++) {
                    hash[i] = urlBytes[prefixStart + i];
                }
                return string(hash);
            }
        }

        return ""; // Not an IPFS URL
    }

    // Internal function to check if a string is an IPFS hash
    function _isIpfsHash(string memory str) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);

        // Check for QmXXX format (46 characters)
        if (
            strBytes.length == 46 && strBytes[0] == 0x51 && strBytes[1] == 0x6D
        ) {
            return true;
        }

        // Check for bafXXX format (59 characters)
        if (
            strBytes.length == 59 &&
            strBytes[0] == 0x62 &&
            strBytes[1] == 0x61 &&
            strBytes[2] == 0x66
        ) {
            return true;
        }

        return false;
    }

    // Get token metadata in a structured format
    function getMetadata()
        external
        view
        returns (
            string memory tokenName,
            string memory tokenSymbol,
            string memory image,
            string memory desc,
            address tokenCreator,
            uint256 totalTokenSupply,
            bool isIpfs
        )
    {
        return (
            name(),
            symbol(),
            imageUrl,
            description,
            creator,
            totalSupply(),
            bytes(imageUrl).length > 0 && _isIpfsHash(imageUrl)
        );
    }
}
