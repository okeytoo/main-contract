// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MultiSignatureWallet {
    using SafeERC20 for IERC20;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint numConfirmations;
    }

    uint public numConfirmationsRequired;

    mapping(address => bool) public isOwner;
    mapping(uint => mapping(address => bool)) public isConfirmed;

    address[] private _owners;
    Transaction[] public transactions;

    uint private constant _MAX_OWNER_COUNT = 30;

    event Deposit(address indexed sender, uint amount, uint balance);
    event SubmitTransaction(
        address indexed owner,
        uint indexed txIndex,
        address indexed to,
        uint value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);
    event OwnerAddition(address indexed owner);
    event OwnerRemoval(address indexed owner);
    event RequirementChange(uint required);

    /**
     * @notice  only owner modifier
     */
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    /**
     * @notice  check the owner not in the owner list modifier
     * @param   owner  .
     */
    modifier ownerDoesNotExist(address owner) {
        require(!isOwner[owner]);
        _;
    }

    /**
     * @notice  check the owner is in the owner list modifier
     * @param   owner  .
     */
    modifier ownerExists(address owner) {
        require(isOwner[owner]);
        _;
    }

    /**
     * @notice  check the wallet is caller of transactions, used for in call like owner functions
     */
    modifier onlyWallet() {
        require(msg.sender == address(this));
        _;
    }

    /**
     * @notice  check incoming id is in the transactions list range
     * @param   _txIndex  .
     */
    modifier txExists(uint _txIndex) {
        require(_txIndex < transactions.length, "tx does not exist");
        _;
    }

    /**
     * @notice  check incoming id is not executed
     * @param   _txIndex  .
     */
    modifier notExecuted(uint _txIndex) {
        require(!transactions[_txIndex].executed, "tx already executed");
        _;
    }

    /**
     * @notice  check incoming id is not confirmed
     * @param   _txIndex  .
     */
    modifier notConfirmed(uint _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "tx already confirmed");
        _;
    }

    /**
     * @notice  check incoming address is not null
     * @param   _address  .
     */
    modifier notNull(address _address) {
        require(_address != address(0));
        _;
    }

    /**
     * @notice  check requirements for owner and required wallets
     * @param   ownerCount  .
     * @param   _required  .
     */
    modifier validRequirementCheck(uint ownerCount, uint _required) {
        require(
            ownerCount <= _MAX_OWNER_COUNT &&
                _required <= ownerCount &&
                _required != 0 &&
                ownerCount != 0
        );
        _;
    }

    /**
     * @dev constructor of contract
     * @param owners_ owners array
     * @param numConfirmationsRequired_ transaction confirmation required amount
     */
    constructor(address[] memory owners_, uint numConfirmationsRequired_) {
        require(owners_.length > 0, "owners required");
        require(
            numConfirmationsRequired_ > 0 &&
                numConfirmationsRequired_ <= owners_.length,
            "invalid number of required confirmations"
        );

        for (uint i = 0; i < owners_.length; i++) {
            address owner = owners_[i];

            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            _owners.push(owner);
        }

        numConfirmationsRequired = numConfirmationsRequired_;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    /**
     * @dev add transaction to transaction list
     * @param to_ transaction will execute on this address
     * @param value_ amount ether we want to send
     * @param data_ transaction data that encoded
     */
    function submitTransaction(
        address to_,
        uint value_,
        bytes memory data_
    ) external onlyOwner {
        uint txIndex = transactions.length;

        transactions.push(
            Transaction({
                to: to_,
                value: value_,
                data: data_,
                executed: false,
                numConfirmations: 0
            })
        );

        emit SubmitTransaction(msg.sender, txIndex, to_, value_, data_);
    }

    /**
     * @dev owners can confirm transaction that the list that not confirmed and not executed yet
     * @param txIndex_ transaction id
     */
    function confirmTransaction(
        uint txIndex_
    )
        external
        onlyOwner
        txExists(txIndex_)
        notExecuted(txIndex_)
        notConfirmed(txIndex_)
    {
        Transaction storage transaction = transactions[txIndex_];
        transaction.numConfirmations += 1;
        isConfirmed[txIndex_][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, txIndex_);
    }

    /**
     * @dev owners can executed transaction that in the list and not executed yet
     * @param txIndex_ transaction id
     */
    function executeTransaction(
        uint txIndex_
    ) external onlyOwner txExists(txIndex_) notExecuted(txIndex_) {
        Transaction storage transaction = transactions[txIndex_];

        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "Cannot execute tx"
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "Tx failed");

        emit ExecuteTransaction(msg.sender, txIndex_);
    }

    /**
     * @dev owners can revoke transaction that in the list and not executed
     * @param txIndex_ transaction id
     */
    function revokeConfirmation(
        uint txIndex_
    ) external onlyOwner txExists(txIndex_) notExecuted(txIndex_) {
        Transaction storage transaction = transactions[txIndex_];

        require(isConfirmed[txIndex_][msg.sender], "Tx is not confirmed");

        transaction.numConfirmations -= 1;
        isConfirmed[txIndex_][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, txIndex_);
    }

    /**
     * @notice  Function that returns owner addresses.
     * @return  address[]  owner addresses array.
     */
    function getOwners() external view returns (address[] memory) {
        return _owners;
    }

    /**
     * @notice  Function that returns transaction count.
     * @return  uint  transaction count.
     */
    function getTransactionCount() external view returns (uint) {
        return transactions.length;
    }

    /**
     * @dev get single transaction details
     * @param txIndex_ transaction id
     */
    function getTransactionData(
        uint txIndex_
    )
        external
        view
        returns (
            address to,
            uint value,
            bytes memory data,
            bool executed,
            uint numConfirmations
        )
    {
        Transaction storage transaction = transactions[txIndex_];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }

    /**
     * @notice Function that adds new owner by calling itself.
     * @param owner_ new owner address.
     */
    function addOwner(
        address owner_
    )
        external
        onlyWallet
        ownerDoesNotExist(owner_)
        notNull(owner_)
        validRequirementCheck(_owners.length + 1, numConfirmationsRequired)
    {
        require(owner_ != address(0x0), "Owner cannot be 0x0");
        isOwner[owner_] = true;
        _owners.push(owner_);
        emit OwnerAddition(owner_);
    }

    /**
     * @notice Function that replaces old owner with the new owner by calling itself.
     * @param owner_ owner to be removed.
     * @param newOwner_ owner to be added in place of previous param.
     */
    function replaceOwner(
        address owner_,
        address newOwner_
    ) external onlyWallet ownerExists(owner_) ownerDoesNotExist(newOwner_) {
        for (uint i = 0; i < _owners.length; i++)
            if (_owners[i] == owner_) {
                _owners[i] = newOwner_;
                break;
            }
        isOwner[owner_] = false;
        isOwner[newOwner_] = true;
        emit OwnerRemoval(owner_);
        emit OwnerAddition(newOwner_);
    }

    /**
     * @notice Function that removes the owner from the owners by calling itself.
     * @param owner_ address to be removed.
     */
    function removeOwner(
        address owner_
    ) external onlyWallet ownerExists(owner_) {
        require(_owners.length > 1, "Cannot remove last owner");
        isOwner[owner_] = false;

        for (uint i = 0; i < _owners.length - 1; i++)
            if (_owners[i] == owner_) {
                _owners[i] = _owners[_owners.length - 1];
                break;
            }

        _owners.pop();

        if (numConfirmationsRequired > _owners.length)
            changeRequirement(_owners.length);
        emit OwnerRemoval(owner_);
    }

    /**
     * @notice Function that changes requirement of adjusting owners.
     * @param required_ amount for minimum confirmations.
     */
    function changeRequirement(
        uint required_
    ) public onlyWallet validRequirementCheck(_owners.length, required_) {
        numConfirmationsRequired = required_;
        emit RequirementChange(required_);
    }

    /**
     * @notice  Withdraw native token from contract
     * @param   owners_  owners addresses array those receive token.
     */
    function recoverETH(address[] calldata owners_) external onlyWallet {
        require(owners_.length > 0, "Empty owners array provided");
        uint256 balance = address(this).balance;
        require(balance > 0, "Insufficient ether balance");
        unchecked {
            uint256 amount = balance / owners_.length;
            for (uint256 i; i < owners_.length; ) {
                require(isOwner[owners_[i]], "Adress is not owner");
                payable(owners_[i]).transfer(amount);
                i++;
            }
        }
    }

    /**
     * @notice  Distribute provided token to given owner addresses.
     * @param   token  a token address to be distributed.
     * @param   owners_  owners addresses array those receive token.
     */
    function distribute(
        address token,
        address[] calldata owners_
    ) external onlyWallet {
        require(token != address(0x0), "Token cannot be zero");
        require(owners_.length > 0, "Empty owners array provided");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "Insufficient token balance");
        unchecked {
            uint256 amount = balance / owners_.length;
            for (uint256 i; i < owners_.length; ) {
                require(isOwner[owners_[i]], "Adress is not owner");
                IERC20(token).safeTransfer(owners_[i], amount);
                i++;
            }
        }
    }
}
