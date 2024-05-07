// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20PermitUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {BlackList} from "./shared/BlackList.sol";
import {FeeManaged} from "./shared/FeeManaged.sol";

contract Okeytoo is
    Initializable,
    ERC20Upgradeable,
    ERC20PermitUpgradeable,
    OwnableUpgradeable,
    BlackList,
    FeeManaged
{
    uint8 private oktDecimals;

    event Mint(address indexed destination, uint256 amount);
    event Burn(uint256 amount);
    event DestroyedBlockedFunds(
        address indexed blacklistedUser,
        uint256 balance
    );

    /**
     * @dev     initializes upgradeable contract.
     * @param   name_  token name.
     * @param   symbol_  token symbol.
     * @param   decimals_  token decimals.
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) public initializer {
        oktDecimals = decimals_;
        __ERC20_init(name_, symbol_);
        __ERC20Permit_init(name_);
        __Ownable_init(msg.sender);
        // TODO: Adjust below line before deploying to mainnet
        _mint(msg.sender, 1000000 * (10 ** uint256(decimals())));
    }

    /**
     * @notice  Function that returns decimals of the token.
     * @return  uint8  as diment decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return oktDecimals;
    }

    /**
     * @notice  Function that burns given amount of tokens.
     * @dev     anyone can burn their tokens.
     * @param   amount  amount of tokens that will be burned.
     */
    function burn(uint256 amount) external {
        require(amount <= balanceOf(msg.sender), "Insufficient balance");
        _burn(msg.sender, amount);
        emit Burn(amount);
    }

    /**
     * @notice  Function that transfers given amount from msg.sender to recipient.
     * @param   recipient_  recipient address for transfer.
     * @param   amount_  an amount for transfer.
     * @return  bool  result of transfer.
     */
    function transfer(
        address recipient_,
        uint256 amount_
    ) public virtual override notBlackListed returns (bool) {
        require(
            recipient_ != address(this),
            "ERC20: recipient is contract address"
        );
        require(!isBlackListed[recipient_], "ERC20: recipient is in blacklist");

        uint256 fee = 0;

        if (sellFeeFor(recipient_, amount_) > 0) {
            // Sell
            fee = sellFeeFor(recipient_, amount_);
        } else if (buyFeeFor(msg.sender, amount_) > 0) {
            // Buy
            fee = buyFeeFor(msg.sender, amount_);
        }

        if (fee > 0) {
            super.transfer(owner(), fee);
            return super.transfer(recipient_, amount_ - fee);
        } else {
            return super.transfer(recipient_, amount_);
        }
    }

    /**
     * @notice  Function that transfers given amount from sender to recipient.
     * @param   sender_  sender address for transfer.
     * @param   recipient_  recipient address for transfer.
     * @param   amount_  an amount for transfer.
     * @return  bool  result of transfer.
     */
    function transferFrom(
        address sender_,
        address recipient_,
        uint256 amount_
    ) public virtual override(ERC20Upgradeable) notBlackListed returns (bool) {
        require(
            recipient_ != address(this),
            "ERC20: recipient is contract address"
        );
        require(!isBlackListed[sender_], "ERC20: sender is in blacklist");
        require(!isBlackListed[recipient_], "ERC20: recipient is in blacklist");

        uint256 fee = 0;

        if (sellFeeFor(recipient_, amount_) > 0) {
            // Sell
            fee = sellFeeFor(recipient_, amount_);
        } else if (buyFeeFor(sender_, amount_) > 0) {
            // Buy
            fee = buyFeeFor(sender_, amount_);
        }

        if (fee > 0) {
            super.transferFrom(sender_, owner(), fee);
            return super.transferFrom(sender_, recipient_, amount_ - fee);
        } else {
            return super.transferFrom(sender_, recipient_, amount_);
        }
    }

    /**
     * @notice  Function for transferring token to multiple addresses.
     * @param   recipients_  recipients array to be transferred.
     * @param   amounts_  amounts array to be transferred.
     */
    function multiTransfer(
        address[] memory recipients_,
        uint256[] memory amounts_
    ) external notBlackListed {
        require(recipients_.length > 0, "Empty recipients array provided");
        require(recipients_.length <= 200, "Max transfer limit 500");
        require(
            recipients_.length == amounts_.length,
            "multiTransfer length mismatch"
        );

        unchecked {
            uint256 totalSend = 0;
            uint256 _balance = super.balanceOf(msg.sender);

            for (uint256 i; i < amounts_.length; ) {
                totalSend = totalSend + amounts_[i];
                i++;
            }
            require(
                _balance >= totalSend,
                "multiTransfer amount exceeds balance"
            );

            for (uint256 i; i < recipients_.length; ) {
                transfer(recipients_[i], amounts_[i]);
                i++;
            }
        }
    }

    /**
     * @notice  Function that burns balance of given blacklisted account.
     * @param   account_  blacklisted account address for funds to be destroyed.
     */
    function destroyBlockedFunds(address account_) external onlyOwner {
        require(isBlackListed[account_]);
        uint blockedFunds = balanceOf(account_);
        _burn(account_, blockedFunds);
        emit DestroyedBlockedFunds(account_, blockedFunds);
    }
}
