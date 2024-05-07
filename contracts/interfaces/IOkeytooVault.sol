// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @title Interface needed for reward vault pool
 */
interface IOkeytooVault {
    function rewardPoolWithNFTContract(uint256 _amount) external returns (bool);
}
