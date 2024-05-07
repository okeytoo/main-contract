// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract BlackList is OwnableUpgradeable {
    event AddedBlackList(address _user);
    event RemovedBlackList(address _user);

    /**
     * @notice  Modifier that checks whether msg.sender is already blacklisted.
     */
    modifier notBlackListed() {
        require(
            !isBlackListed[msg.sender],
            "Blocked: all transfers blocked for this wallet"
        );
        _;
    }

    mapping(address => bool) public isBlackListed;

    /**
     * @notice  Function that adds provided account to blacklist.
     * @param   _evilUser  an address of user for adding to blacklist.
     */
    function addBlackList(address _evilUser) external onlyOwner {
        isBlackListed[_evilUser] = true;
        emit AddedBlackList(_evilUser);
    }

    /**
     * @notice  Function that removes provided account from blacklist.
     * @param   _clearedUser  an address of user for removing from blacklist.
     */
    function removeBlackList(address _clearedUser) external onlyOwner {
        isBlackListed[_clearedUser] = false;
        emit RemovedBlackList(_clearedUser);
    }
}
