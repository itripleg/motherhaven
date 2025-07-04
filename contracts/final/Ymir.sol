// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IBurnManager {
    function notifyBurn(address burner, uint256 amount) external;
    function supportsToken(address token) external view returns (bool);
}

contract Ymir is ERC721, IBurnManager, Ownable {
    using Strings for uint256;

    // The specific token that can be sacrificed
    address public immutable shinzouToken;

    // Constants
    uint256 public constant SACRIFICE_AMOUNT = 1000 * 10 ** 18; // 1000 tokens

    // State variables
    uint256 private _tokenIds;
    mapping(uint256 => uint8) public titanTypes; // 0-8 for different titans
    mapping(address => uint256) public burnedAmount;

    string[9] private titanNames = [
        "Attack Titan",
        "Armored Titan",
        "Colossal Titan",
        "Female Titan",
        "Beast Titan",
        "Jaw Titan",
        "Cart Titan",
        "War Hammer Titan",
        "Founding Titan"
    ];

    event TokensBurned(
        address indexed burner,
        uint256 amount,
        uint256 totalBurned
    );
    event TitanCreated(
        address indexed creator,
        uint256 indexed tokenId,
        uint8 titanType
    );

    constructor(
        address _shinzouToken,
        address initialOwner
    ) ERC721("Nine Titans", "YMRMR") Ownable(initialOwner) {
        require(_shinzouToken != address(0), "Invalid token address");
        shinzouToken = _shinzouToken;
    }

    function notifyBurn(address burner, uint256 amount) external {
        require(msg.sender == shinzouToken, "Only Shinzou token");
        burnedAmount[burner] += amount;
        emit TokensBurned(burner, amount, burnedAmount[burner]);
    }

    function supportsToken(address token) external view returns (bool) {
        return token == shinzouToken;
    }

    function createTitan() external {
        require(
            burnedAmount[msg.sender] >= SACRIFICE_AMOUNT,
            "Insufficient burned tokens"
        );

        // Subtract the sacrifice amount
        burnedAmount[msg.sender] -= SACRIFICE_AMOUNT;

        // Generate random titan type (0-8)
        uint256 randomNumber = uint256(
            keccak256(
                abi.encodePacked(
                    msg.sender,
                    block.timestamp,
                    block.prevrandao,
                    _tokenIds
                )
            )
        );
        uint8 titanType = uint8(randomNumber % 9);

        // Mint the titan
        _tokenIds++;
        _mint(msg.sender, _tokenIds);
        titanTypes[_tokenIds] = titanType;

        emit TitanCreated(msg.sender, _tokenIds, titanType);
    }

    function getTitanType(
        uint256 tokenId
    ) external view returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return titanNames[titanTypes[tokenId]];
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return
            string(
                abi.encodePacked(
                    "ipfs://QmHash/",
                    titanNames[titanTypes[tokenId]],
                    ".json"
                )
            );
    }

    function tokensNeededForNextTitan(
        address user
    ) external view returns (uint256) {
        if (burnedAmount[user] >= SACRIFICE_AMOUNT) {
            return 0;
        }
        return SACRIFICE_AMOUNT - burnedAmount[user];
    }
}
