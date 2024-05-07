// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {IOkeytooVault} from "./interfaces/IOkeytooVault.sol";

contract OkeytooPlayer is ERC721EnumerableUpgradeable, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using Strings for uint256;
    uint8 private usdtFeePercentage;
    uint8 private oktFeePercentage;
    uint8 private vaultFeePercentage;

    address public operator;
    string private baseURI;
    address private token;
    address private usdt;
    address private swapRouter;
    bool private vaultCollectEnabled;
    bool private directSwapEnabled;
    bool private vaultSwapEnabled;
    address public vault;

    struct DepositResult {
        uint amount;
        uint tokenId;
    }

    event OKTDepositReceived(
        address indexed account,
        uint256 tokenId,
        uint256 totalAmount,
        uint256 amount
    );
    event USDTDepositReceived(
        address indexed account,
        uint256 tokenId,
        uint256 totalAmount,
        uint256 amount
    );
    event Withdrawn(address indexed account, uint256 tokenId, uint256 amount);
    event LogTokenMinted(address indexed minter, uint256 indexed tokenId);
    event BaseURIUpdated(string indexed oldValue, string indexed newValue);
    event MintPriceUpdated(uint256 indexed oldValue, uint256 indexed newValue);

    /**
     * @notice  Modifiers that checks  if msg sender is operator
     * @dev being used on operator exclusive methods
     */
    modifier onlyOperator() {
        require(msg.sender == operator, "Not operator");
        _;
    }

    /**
     * @notice  Initializes upgradeable contract
     * @param   name_  name of the NFT
     * @param   symbol_  symbol of the NFT
     * @param   _operator  operator contract that executes few functionalities for exchange
     * @param   _uri  uri of the token
     * @param   _token  OKT token address
     * @param   _usdt  USDT token address
     * @param   _swapRouter  v2 swap router address
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        address _operator,
        string memory _uri,
        address _token,
        address _usdt,
        address _swapRouter
    ) public initializer {
        __ERC721_init(name_, symbol_);
        __Ownable_init(msg.sender);
        operator = _operator;
        baseURI = _uri;
        token = _token;
        usdt = _usdt;
        swapRouter = _swapRouter;
    }

    /**
     * @notice  Function that returns complete metadata uri for given tokenId
     * @param   tokenId  identifier of token which url requested for
     * @return  string  returns complete uri of nft with given tokenId
     */
    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        string memory uri = _baseURI();
        return
            bytes(uri).length > 0 ? string.concat(uri, tokenId.toString()) : "";
    }

    /*
     * @notice Sending native ether to this contract is not allowed
     */
    receive() external payable {
        revert("Ether is not allowed");
    }

    function getAmountOutForOKT(
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        uint256 vaultFeeOKT = (amountIn * vaultFeePercentage) / 100;
        if (directSwapEnabled) {
            address[] memory path = new address[](2);
            path[0] = token;
            path[1] = usdt;
            uint256 _amountOut = IUniswapV2Router02(swapRouter).getAmountsOut(
                amountIn - vaultFeeOKT,
                path
            )[1];
            uint256 fee = (_amountOut * oktFeePercentage) / 100;
            amountOut = _amountOut - fee;
        } else {
            uint256 fee = (amountIn * usdtFeePercentage) / 100;
            amountOut = amountIn - (fee + vaultFeeOKT);
        }
    }

    /**
     * @notice  Function that enables deposit for player via OKT token, applied fee percentage is different than USDT
     * @dev     Callable from anyone, if player doesn't have any NFT's this function will create one
     *          Directly swaps to USDT in order to secure payers
     *          Decided to switch UniswapV2 as V3 does not support fee-on-transfers tokens
     *          see https://docs.uniswap.org/concepts/protocol/integration-issues#fee-on-transfer-tokens
     * @param   amount  amount which will be credited to player after subtracting fees
     * @param   deadline  deadline of permit
     * @param   v  sig.v
     * @param   r  sig.r
     * @param   s  sig.s
     */
    function depositOKTWithPermit(
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(
            IERC20(token).balanceOf(msg.sender) >= amount,
            "Insufficient balance"
        );
        IERC20Permit(token).permit(
            msg.sender,
            address(this),
            amount,
            deadline,
            v,
            r,
            s
        );
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        uint256 vaultFeeOKT = 0;
        if (vaultCollectEnabled) {
            vaultFeeOKT = (amount * vaultFeePercentage) / 100;
            IOkeytooVault(vault).rewardPoolWithNFTContract(vaultFeeOKT);
        }
        uint256 amountOut;
        if (directSwapEnabled) {
            TransferHelper.safeApprove(
                address(token),
                address(swapRouter),
                amount - vaultFeeOKT
            );
            uint256 amountOutMin = 0;
            address[] memory path = new address[](2);
            path[0] = token;
            path[1] = usdt;
            uint256 _amountOut = IUniswapV2Router02(swapRouter)
                .swapExactTokensForTokens(
                    amount - vaultFeeOKT,
                    amountOutMin,
                    path,
                    address(this),
                    block.timestamp + 300
                )[path.length - 1];
            uint256 fee = (_amountOut * oktFeePercentage) / 100;
            IERC20(usdt).safeTransfer(owner(), fee);
            amountOut = _amountOut - fee;
        } else {
            uint256 fee = (amount * oktFeePercentage) / 100;
            IERC20(token).safeTransfer(owner(), fee);
            amountOut = amount - (fee + vaultFeeOKT);
        }
        uint256 tokenId = depositNFT(msg.sender);
        emit OKTDepositReceived(msg.sender, tokenId, amount, amountOut);
    }

    /**
     * @notice  Function that enables deposit for player via OKT token, applied fee percentage is different than USDT
     * @dev     Callable from anyone, if player doesn't have any NFT's this function will create one
     * @param   amount  amount which will be credited to player after subtracting fees
     * @param   deadline  deadline of permit
     * @param   v  sig.v
     * @param   r  sig.r
     * @param   s  sig.s
     */
    function depositUSDTWithPermit(
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(
            IERC20(usdt).balanceOf(msg.sender) >= amount,
            "Insufficient balance"
        );
        IERC20Permit(usdt).permit(
            msg.sender,
            address(this),
            amount,
            deadline,
            v,
            r,
            s
        );
        IERC20(usdt).safeTransferFrom(msg.sender, address(this), amount);
        uint256 fee = (amount * usdtFeePercentage) / 100;
        IERC20(usdt).safeTransfer(owner(), fee);
        uint256 vaultFeeUSDT = 0;
        if (vaultCollectEnabled && vaultSwapEnabled) {
            vaultFeeUSDT = (amount * vaultFeePercentage) / 100;
            TransferHelper.safeApprove(
                address(usdt),
                address(swapRouter),
                vaultFeeUSDT
            );
            uint256 amountOutMin = 0;
            address[] memory path = new address[](2);
            path[0] = usdt;
            path[1] = token;
            uint256 vaultFee = IUniswapV2Router02(swapRouter)
                .swapExactTokensForTokens(
                    vaultFeeUSDT,
                    amountOutMin,
                    path,
                    address(this),
                    block.timestamp + 300
                )[path.length - 1];
            IOkeytooVault(vault).rewardPoolWithNFTContract(vaultFee);
        }
        uint256 amountOut = amount - (fee + vaultFeeUSDT);
        uint256 tokenId = depositNFT(msg.sender);
        emit USDTDepositReceived(msg.sender, tokenId, amount, amountOut);
    }

    /**
     * @notice  Function that withdraws credits and pays back to user as USDT
     * @dev     This function is only callable from operator
     * @param   account_  an account address of player
     * @param   tokenId_  tokenId of player
     * @param   amount_   requested withdrawal amount
     */
    function withdrawCredits(
        address account_,
        uint256 tokenId_,
        uint256 amount_
    ) external onlyOperator {
        require(ownerOf(tokenId_) == account_, "Token authority is invalid");
        require(
            amount_ <= IERC20(usdt).balanceOf(address(this)),
            "Insufficient balance"
        );
        IERC20(usdt).safeTransfer(account_, amount_);
        emit Withdrawn(account_, tokenId_, amount_);
    }

    /**
     * @notice  Sets uri base for the collection
     * @dev     could be given public endpoint that provides metadata json
     * @param   _newBaseURI  base uri for metadata reference
     */
    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        emit BaseURIUpdated(baseURI, _newBaseURI);
        baseURI = _newBaseURI;
    }

    /**
     * @notice  Function that sets the operator of the contract
     * @dev     cannot be zero and method is only callable by owner of the contract
     * @param   _operator  operator address
     */
    function setOperator(address _operator) external onlyOwner {
        require(
            _operator != address(0),
            "Address 0x0 is not allowed for operator"
        );
        operator = _operator;
    }

    /**
     * @notice  Function that sets directSwapEnabled flag
     * @dev     Only owner can call this function
     * @param   _directSwapEnabled  the flag of direct swap
     */
    function setDirectSwapEnabled(bool _directSwapEnabled) external onlyOwner {
        directSwapEnabled = _directSwapEnabled;
    }

    /**
     * @notice  Function that sets vaultCollectEnabled flag
     * @dev     Only owner can call this function
     * @param   _vaultCollectEnabled  the flag of vault collection
     */
    function setVaultCollectEnabled(
        bool _vaultCollectEnabled
    ) external onlyOwner {
        vaultCollectEnabled = _vaultCollectEnabled;
    }

    /**
     * @notice  Function that sets vaultSwapEnabled flag
     * @dev     Only owner can call this function
     * @param   _vaultSwapEnabled  the flag of vault swap
     */
    function setVaultSwapEnabled(bool _vaultSwapEnabled) external onlyOwner {
        vaultSwapEnabled = _vaultSwapEnabled;
    }

    /**
     * @notice  .
     * @dev     .
     * @param   _usdtFeePercentage  .
     * @param   _oktFeePercentage  .
     * @param   _vaultFeePercentage  .
     */
    function setFees(
        uint8 _usdtFeePercentage,
        uint8 _oktFeePercentage,
        uint8 _vaultFeePercentage
    ) external onlyOwner {
        usdtFeePercentage = _usdtFeePercentage;
        oktFeePercentage = _oktFeePercentage;
        vaultFeePercentage = _vaultFeePercentage;
    }

    /**
     * @notice  Function that sets the vault address
     * @dev     this function is owner-exclusive
     * @param   _vault  address of the vault
     */
    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "Cannot be zero");
        vault = _vault;
    }

    /**
     * @notice  Function that recovers token for given token address
     * @dev     transfer funds to msg.sender which in this case is owner
     * @param   token_  a token address that'll being recovered
     */
    function recoverToken(address token_) external onlyOwner {
        IERC20(token_).safeTransfer(
            msg.sender,
            IERC20(token_).balanceOf(address(this))
        );
    }

    /**
     * @notice  Function that returns deposit nft, if there's none mints one and returns that
     * @dev     private function that's only called from deposit functions
     * @param   _account  an account to select deposited nft
     * @return  tokenId  as deposit nft
     */
    function depositNFT(address _account) private returns (uint256 tokenId) {
        uint256 balance = balanceOf(_account);
        if (balance > 0) {
            tokenId = tokenOfOwnerByIndex(_account, 0);
        } else {
            uint256 newItemId = totalSupply() + 1;
            _safeMint(_account, newItemId);
            tokenId = newItemId;
        }
    }

    /**
     * @notice  Returns baseURI as metadata reference
     * @return  string  baseURI that references metadata
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }
}
