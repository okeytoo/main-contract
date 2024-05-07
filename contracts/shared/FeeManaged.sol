// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract FeeManaged is OwnableUpgradeable {
    mapping(address => uint256) public buyFeeRate;
    mapping(address => uint256) public sellFeeRate;

    /**
     * @notice  Function that returns calculated buy fee amount.
     * @param   address_  an address which buy fee will be applied on.
     * @param   amount_  buy amount for calculating buy fee.
     * @return  uint256  calculated fee amount.
     */
    function buyFeeFor(
        address address_,
        uint256 amount_
    ) internal view returns (uint256) {
        return (amount_ * buyFeeRate[address_]) / 100;
    }

    /**
     * @notice  Function that returns calculated sell fee amount.
     * @param   address_ an address which sell fee will be applied on.
     * @param   amount_  sell amount for calculating sell fee.
     * @return  uint256  calculated fee amount.
     */
    function sellFeeFor(
        address address_,
        uint256 amount_
    ) internal view returns (uint256) {
        return (amount_ * sellFeeRate[address_]) / 100;
    }

    /**
     * @notice  Function for adjusting fee rates.
     * @dev     Callable by only owner
     * @param   address_  an address of fee is applied
     * @param   buyFeeRate_  a fee rate which is applied when buy occurs.
     * @param   sellFeeRate_  a fee rate which is applied when sell occurs.
     */
    function setFees(
        address address_,
        uint256 buyFeeRate_,
        uint256 sellFeeRate_
    ) external onlyOwner {
        buyFeeRate[address_] = buyFeeRate_;
        sellFeeRate[address_] = sellFeeRate_;
    }
}
