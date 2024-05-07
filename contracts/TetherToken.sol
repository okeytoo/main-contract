// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract TetherToken is ERC20, ERC20Permit {
    constructor() ERC20("Tether USD", "USDT") ERC20Permit("Tether USD") {
        _mint(msg.sender, 1000000 * (10 ** uint256(decimals())));
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
