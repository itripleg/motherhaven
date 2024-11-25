// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    constructor(
        address initialOwner,
        string memory name,
        string memory ticker,
        uint256 initialMint
    ) ERC20(name, ticker) Ownable(initialOwner) {
        _mint(initialOwner, initialMint);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burnFrom(address account, uint256 amount) external {
        _burn(account, amount);
    }
}
