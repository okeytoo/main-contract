import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import MultiSignatureWalletArtifact from "../contracts/MultiSignatureWallet.json";
import OkeytooArtifact from "../contracts/Okeytoo.json";
import NFTArtifact from "../contracts/OkeytooPlayer.json";
import USDTArtifact from "../contracts/TetherToken.json";
import contractAddress from "../contracts/contract-address.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Multisig } from "./Multisig";
import { OkeytooNFT } from "./OkeytooNFT";
import { OkeytooToken } from "./OkeytooToken";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";

const Artifacts = {
    MultiSignatureWallet: MultiSignatureWalletArtifact,
    Okeytoo: OkeytooArtifact,
    OkeytooPlayer: NFTArtifact,
    USDT: USDTArtifact,
};

// const NETWORK_ID = "5"; // Ethereum Goerli
const NETWORK_ID = "11155111"; // Ethereum Sepolia
// const NETWORK_ID = "31337"; // This is the default id used by the Hardhat Network
// const NETWORK_ID = "421613"; // Arbitrum Goerli
// const NETWORK_ID = "421614"; // Arbitrum Sepolia

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// This component is in charge of doing these things:
//   1. It connects to the user's wallet
//   2. Initializes ethers and the Token contract
//   3. Polls the user balance to keep it updated.
//   4. Transfers tokens by sending transactions
//   5. Renders the whole application
//
// Note that (3) and (4) are specific of this sample application, but they show
// you how to keep your Dapp and contract's state in sync,  and how to send a
// transaction.
export class Dapp extends React.Component {
    constructor(props) {
        super(props);

        // We store multiple things in Dapp's state.
        // You don't need to follow this pattern, but it's an useful example.
        this.initialState = {
            // The user's address
            selectedAddress: undefined,
            // Current chainId
            chainId: undefined,
            multiSigData: undefined,
            usdtData: { name: "Tether Token", symbol: "USDT", balance: 0 },
            tokenData: undefined,
            nftData: undefined,
            // The ID about transactions being sent, and any possible error with them
            txBeingSent: undefined,
            transactionError: undefined,
            networkError: undefined,
        };

        this.state = this.initialState;
    }

    render() {
        // Ethereum wallets inject the window.ethereum object. If it hasn't been
        // injected, we instruct the user to install a wallet.
        if (window.ethereum === undefined) {
            return <NoWalletDetected />;
        }

        // The next thing we need to do, is to ask the user to connect their wallet.
        // When the wallet gets connected, we are going to save the users's address
        // in the component's state. So, if it hasn't been saved yet, we have
        // to show the ConnectWallet component.
        //
        // Note that we pass it a callback that is going to be called when the user
        // clicks a button. This callback just calls the _connectWallet method.
        if (!this.state.selectedAddress) {
            return (
                <ConnectWallet
                    connectWallet={() => this._connectWallet()}
                    networkError={this.state.networkError}
                    dismiss={() => this._dismissNetworkError()}
                />
            );
        }

        // If the token data or the user's balance hasn't loaded yet, we show
        // a loading component.
        if (!this.state.multiSigData || !this.state.tokenData || !this.state.nftData) {
            return <Loading />;
        }

        // If everything is loaded, we render the application.
        return (
            <div className="container p-4">
                <div className="row">
                    <div className="col-12">
                        <h1>Okeytoo</h1>
                    </div>
                </div>

                <hr />

                <div className="row">
                    <div className="col-12">
                        {/* 
              Sending a transaction isn't an immediate action. You have to wait
              for it to be mined.
              If we are waiting for one, we show a message here.
            */}
                        {this.state.txBeingSent && <WaitingForTransactionMessage txHash={this.state.txBeingSent} />}

                        {/* 
              Sending a transaction can fail in multiple ways. 
              If that happened, we show a message here.
            */}
                        {this.state.transactionError && (
                            <TransactionErrorMessage
                                message={this._getRpcErrorMessage(this.state.transactionError)}
                                dismiss={() => this._dismissTransactionError()}
                            />
                        )}
                    </div>
                </div>

                <div className="my-4 p-4 contract-box">
                    <h2>
                        {MultiSignatureWalletArtifact.contractName} | {this.state.multiSigData.oktBalance} $OKT |{" "}
                        {this.state.multiSigData.usdtBalance} $USDT | {this.state.multiSigData.balance} $ETH
                    </h2>
                    <h4>{contractAddress["MultiSignatureWallet"]}</h4>
                    <div className="row">
                        <div className="col-12">
                            <Multisig
                                multiSigData={this.state.multiSigData}
                                addOwner={(owner) => this._addOwner(owner)}
                                removeOwner={(owner) => this._removeOwner(owner)}
                                submitTransaction={(address, value, abi, func, params) =>
                                    this._submitTransaction(address, value, abi, func, params)
                                }
                                confirmTransaction={(index) => this._confirmTransaction(index)}
                                revokeConfirmation={(index) => this._revokeConfirmation(index)}
                                executeTransaction={(index) => this._executeTransaction(index)}
                                recoverETH={(owners) => this._recoverETH(owners)}
                                distribute={(token, owners) => this._distribute(token, owners)}
                            />
                        </div>
                    </div>
                </div>

                <div className="my-4 p-4 contract-box">
                    <h2>
                        {OkeytooArtifact.contractName} ({this.state.tokenData.symbol})
                    </h2>
                    <h4>{contractAddress["Okeytoo"]}</h4>
                    <p>
                        Welcome <b>{this.state.selectedAddress}</b>, you have{" "}
                        <b>
                            {ethers.formatUnits(this.state.tokenData.balance, 18)} ${this.state.tokenData.symbol}
                        </b>
                        {", "}
                        <b>
                            {ethers.formatUnits(this.state.usdtData.balance, 6)} ${this.state.usdtData.symbol}
                        </b>
                        .
                    </p>
                    <div className="row">
                        <div className="col-12">
                            <OkeytooToken
                                tokenSymbol={this.state.tokenData.symbol}
                                burnTokens={(amount) => this._burnTokens(amount)}
                                transferTokens={(to, amount) => this._transferTokens(to, amount)}
                            />
                        </div>
                    </div>
                </div>

                <div className="my-4 p-4 contract-box">
                    <h2>
                        {NFTArtifact.contractName} ({this.state.nftData.symbol}) | {this.state.nftData.oktBalance} $OKT
                        {" | "}
                        {this.state.nftData.usdtBalance} $USDT
                    </h2>
                    <h4>{contractAddress[NFTArtifact.contractName]}</h4>
                    <p>
                        Welcome <b>{this.state.selectedAddress}</b>, you have{" "}
                        <b>
                            {ethers.formatUnits(this.state.nftData.balance, 0)} {this.state.nftData.symbol}
                        </b>
                        .
                    </p>
                    <div className="row">
                        <div className="col-12">
                            <OkeytooNFT
                                depositToken={(amount) => this._depositOKT(amount)}
                                depositUSDT={(amount) => this._depositUSDT(amount)}
                                tokens={this.state.nftData.tokens}
                                withdrawCredits={(amount, tokenId) => this._withdrawCredits(amount, tokenId)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    componentWillUnmount() {
        // gets unmounted
    }

    async _connectWallet() {
        // This method is run when the user clicks the Connect. It connects the
        // dapp to the user's wallet, and initializes it.

        // To connect to the user's wallet, we have to run this method.
        // It returns a promise that will resolve to the user's address.
        const [selectedAddress] = await window.ethereum.request({ method: "eth_requestAccounts" });

        // Once we have the address, we can initialize the application.

        // First we check the network
        this._checkNetwork();

        this._initialize(selectedAddress);

        // We reinitialize it whenever the user changes their account.
        window.ethereum.on("accountsChanged", ([newAddress]) => {
            // `accountsChanged` event can be triggered with an undefined newAddress.
            // This happens when the user removes the Dapp from the "Connected
            // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
            // To avoid errors, we reset the dapp state
            if (newAddress === undefined) {
                return this._resetState();
            }

            this._initialize(newAddress);
        });
    }

    async _initialize(userAddress) {
        // This method initializes the dapp

        // We first store the user's address in the component's state
        this.setState({
            selectedAddress: userAddress,
        });

        // Fetching the token data and the user's balance are specific to this
        // sample project, but you can reuse the same initialization pattern.
        await this._initializeEthers();
        this._registerForEvents();
        this._getMultiSigData();
        this._getUSDTData();
        this._getTokenData();
        this._getNFTData();
    }

    async _initializeEthers() {
        // We first initialize ethers by creating a provider using window.ethereum
        this._provider = new ethers.BrowserProvider(window.ethereum);

        const signer = await this._provider.getSigner(0);

        // Then, we initialize the contract using that provider and the token's
        // artifact. You can do this same thing with your contracts.
        this._multisig = new ethers.Contract(
            contractAddress.MultiSignatureWallet,
            MultiSignatureWalletArtifact.abi,
            signer
        );
        this._usdt = new ethers.Contract(contractAddress.TetherToken, USDTArtifact.abi, signer);
        this._token = new ethers.Contract(contractAddress.Okeytoo, OkeytooArtifact.abi, signer);
        this._okeytooPlayer = new ethers.Contract(contractAddress.OkeytooPlayer, NFTArtifact.abi, signer);
    }

    async _registerForEvents() {
        this._provider.on("block", async (blockNumber) => {
            console.log(`Block ${blockNumber}`);
        });
        this._okeytooPlayer.on("OKTDepositReceived", async (account, tokenId, amount) => {
            console.log("OKT Deposit received from", account, "with tokenId", tokenId, "and amount", amount);
        });
        this._okeytooPlayer.on("USDTDepositReceived", async (account, tokenId, amount) => {
            console.log("USDT Deposit received from", account, "with tokenId", tokenId, "and amount", amount);
        });
        this._okeytooPlayer.on("Withdrawn", async (account, tokenId, amount) => {
            console.log("Withdraw received from", account, "with tokenId", tokenId, "and amount", amount);
        });
        // this._multisig.on("SubmitTransaction", async (owner, txIndex, to, value, data) => {
        //     console.log(
        //         `${owner} submitted new transaction with index ${txIndex} to ${to} with value ${value} and data ${data}`
        //     );
        // });
        // this._multisig.on(this._multisig.filters.ConfirmTransaction, async (address, index) => {
        //     console.log(`Tx ${index} confirmed by owner ${address}`);
        //     const multiSigData = this.state.multiSigData;
        //     const transactions = multiSigData.transactions;
        //     if (transactions && transactions.length > index) {
        //         transactions[index].numConfirmations += 1;
        //         if (address.toUpperCase() === this.state.selectedAddress.toUpperCase()) {
        //             transactions[index].isConfirmedByCurrentSigner = true;
        //         }
        //         multiSigData.transactions = transactions;
        //         this.setState({ multiSigData });
        //     }
        // });
        // this._multisig.on("ExecuteTransaction", async (address, index) => {
        //     console.log(`Tx ${index} executed by owner ${address}`);
        // });
    }

    async _getMultiSigData() {
        const owners = await this._multisig.getOwners();
        const numConfirmationsRequired = parseInt(await this._multisig.numConfirmationsRequired());
        const transactionCount = parseInt(await this._multisig.getTransactionCount());
        const transactions = [];
        const balance = parseFloat(
            ethers.formatEther(await this._provider.getBalance(contractAddress.MultiSignatureWallet))
        ).toFixed(4);
        const oktBalance = parseInt(
            ethers.formatUnits(await this._token.balanceOf(await this._multisig.getAddress()), 18)
        );
        // const usdtBalance = parseInt(
        //     ethers.formatUnits(await this._usdt.balanceOf(await this._multisig.getAddress()), 6)
        // );
        const usdtBalance = 0;
        if (transactionCount > 0) {
            for (let i = 0; i < transactionCount; i++) {
                const tx = await this._multisig.transactions(i);
                const address = tx[0];
                const data = tx[2];
                const contractName = Object.keys(contractAddress).find((key) => contractAddress[key] === address);
                const iface = new ethers.Interface(Artifacts[contractName].abi);
                const functionName = iface.getFunction(data.slice(0, 10)).name;
                const params = iface.decodeFunctionData(data.slice(0, 10), data);
                const isConfirmed = await this._multisig.isConfirmed(i, this.state.selectedAddress);
                transactions.push({
                    to: address,
                    value: parseInt(ethers.formatEther(tx[1])),
                    data: data,
                    executed: tx[3],
                    numConfirmations: parseInt(tx[4]),
                    contractName: contractName,
                    func: functionName,
                    params: params,
                    isConfirmedByCurrentSigner: isConfirmed,
                });
            }
        }

        this.setState(
            {
                multiSigData: {
                    owners,
                    numConfirmationsRequired,
                    transactionCount,
                    transactions,
                    balance,
                    oktBalance,
                    usdtBalance,
                },
            },
            () => {
                console.log(this.state.multiSigData);
            }
        );
    }

    async _getUSDTData() {
        const name = await this._usdt.name();
        const symbol = await this._usdt.symbol();
        let balance = 0;
        if (this.state.selectedAddress) {
            const usdtBalance = await this._usdt.balanceOf(this.state.selectedAddress);
            balance = usdtBalance;
        }
        this.setState({ usdtData: { name, symbol, balance } }, () => {
            console.log(this.state.usdtData);
        });
    }

    // The next two methods just read from the contract and store the results
    // in the component state.
    async _getTokenData() {
        const name = await this._token.name();
        const symbol = await this._token.symbol();
        let balance = 0;
        if (this.state.selectedAddress) {
            const tokenBalance = await this._token.balanceOf(this.state.selectedAddress);
            balance = tokenBalance;
        }
        this.setState({ tokenData: { name, symbol, balance } }, () => {
            console.log(this.state.tokenData);
        });
    }

    async _getNFTData() {
        const name = await this._okeytooPlayer.name();
        const symbol = await this._okeytooPlayer.symbol();
        let balance = 0;
        const address = this.state.selectedAddress;
        const tokens = [];
        const oktBalance = parseInt(
            ethers.formatUnits(await this._token.balanceOf(await this._okeytooPlayer.getAddress()), 18)
        );
        // const usdtBalance = parseInt(
        //     ethers.formatUnits(await this._usdt.balanceOf(await this._okeytooPlayer.getAddress()), 6)
        // );
        const usdtBalance = 0;
        if (address) {
            const nftBalance = await this._okeytooPlayer.balanceOf(address);
            balance = nftBalance;
            for (let i = 0; i < balance; i++) {
                const tokenId = await this._okeytooPlayer.tokenOfOwnerByIndex(address, i);
                const tokenURI = await this._okeytooPlayer.tokenURI(tokenId);
                tokens.push({
                    tokenId: parseInt(tokenId),
                    metadata: tokenURI,
                });
            }
        }

        this.setState({ nftData: { name, symbol, balance, tokens, oktBalance, usdtBalance } }, () => {
            console.log(this.state.nftData);
        });
    }

    async _addOwner(owner) {
        try {
            const iface = new ethers.Interface(MultiSignatureWalletArtifact.abi);
            const bytes = iface.encodeFunctionData("addOwner", [owner]);
            const tx = await this._multisig.submitTransaction(contractAddress.MultiSignatureWallet, 0, bytes);
            this.setState({ txBeingSent: tx.hash });
            await tx.wait();
            await this._getMultiSigData();
        } catch (error) {
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }
            console.error(error);
            this.setState({ transactionError: error });
        } finally {
            this.setState({ txBeingSent: undefined });
        }
    }

    async _removeOwner(owner) {
        try {
            const iface = new ethers.Interface(MultiSignatureWalletArtifact.abi);
            const bytes = iface.encodeFunctionData("removeOwner", [owner]);
            const tx = await this._multisig.submitTransaction(contractAddress.MultiSignatureWallet, 0, bytes);
            this.setState({ txBeingSent: tx.hash });
            await tx.wait();
            await this._getMultiSigData();
        } catch (error) {
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }
            console.error(error);
            this.setState({ transactionError: error });
        } finally {
            this.setState({ txBeingSent: undefined });
        }
    }

    async _submitTransaction(address, value, abi, func, params) {
        try {
            const iface = new ethers.Interface(abi);
            const bytes = iface.encodeFunctionData(func, params.split(","));
            const tx = await this._multisig.submitTransaction(address, ethers.parseUnits(value, 18), bytes);
            this.setState({ txBeingSent: tx.hash });
            await tx.wait();
            await this._getMultiSigData();
        } catch (error) {
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }
            console.error(error);
            this.setState({ transactionError: error });
        } finally {
            this.setState({ txBeingSent: undefined });
        }
    }

    async _confirmTransaction(index) {
        try {
            const tx = await this._multisig.confirmTransaction(index);
            this.setState({ txBeingSent: tx.hash });
            await tx.wait();
            await this._getMultiSigData();
        } catch (error) {
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }
            console.error(error);
            this.setState({ transactionError: error });
        } finally {
            this.setState({ txBeingSent: undefined });
        }
    }

    async _revokeConfirmation(index) {
        try {
            const tx = await this._multisig.revokeConfirmation(index);
            this.setState({ txBeingSent: tx.hash });
            await tx.wait();
            await this._getMultiSigData();
        } catch (error) {
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }
            console.error(error);
            this.setState({ transactionError: error });
        } finally {
            this.setState({ txBeingSent: undefined });
        }
    }

    async _executeTransaction(index) {
        try {
            const tx = await this._multisig.executeTransaction(index);
            this.setState({ txBeingSent: tx.hash });
            await tx.wait();
            await this._getMultiSigData();
        } catch (error) {
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }
            console.error(error);
            this.setState({ transactionError: error });
        } finally {
            this.setState({ txBeingSent: undefined });
        }
    }

    async _recoverETH(receivers) {
        try {
            const iface = new ethers.Interface(MultiSignatureWalletArtifact.abi);
            const bytes = iface.encodeFunctionData("recoverETH", [receivers]);
            const tx = await this._multisig.submitTransaction(contractAddress.MultiSignatureWallet, 0, bytes);
            this.setState({ txBeingSent: tx.hash });
            await tx.wait();
            await this._getMultiSigData();
        } catch (error) {
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }
            console.error(error);
            this.setState({ transactionError: error });
        } finally {
            this.setState({ txBeingSent: undefined });
        }
    }

    async _distribute(token, receivers) {
        try {
            const iface = new ethers.Interface(MultiSignatureWalletArtifact.abi);
            const bytes = iface.encodeFunctionData("distribute", [token, receivers]);
            const tx = await this._multisig.submitTransaction(contractAddress.MultiSignatureWallet, 0, bytes);
            this.setState({ txBeingSent: tx.hash });
            await tx.wait();
            await this._getMultiSigData();
        } catch (error) {
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }
            console.error(error);
            this.setState({ transactionError: error });
        } finally {
            this.setState({ txBeingSent: undefined });
        }
    }

    async _burnTokens(amount) {
        try {
            const tx = await this._token.burn(ethers.parseUnits(amount, 18));
            this.setState({ txBeingSent: tx.hash });
            await tx.wait();
            await this._getTokenData();
        } catch (error) {
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }
            console.error(error);
            this.setState({ transactionError: error });
        } finally {
            this.setState({ txBeingSent: undefined });
        }
    }

    // This method sends an ethereum transaction to transfer tokens.
    // While this action is specific to this application, it illustrates how to
    // send a transaction.
    async _transferTokens(to, amount) {
        // Sending a transaction is a complex operation:
        //   - The user can reject it
        //   - It can fail before reaching the ethereum network (i.e. if the user
        //     doesn't have ETH for paying for the tx's gas)
        //   - It has to be mined, so it isn't immediately confirmed.
        //     Note that some testing networks, like Hardhat Network, do mine
        //     transactions immediately, but your dapp should be prepared for
        //     other networks.
        //   - It can fail once mined.
        //
        // This method handles all of those things, so keep reading to learn how to
        // do it.

        try {
            // If a transaction fails, we save that error in the component's state.
            // We only save one such error, so before sending a second transaction, we
            // clear it.
            this._dismissTransactionError();

            // We send the transaction, and save its hash in the Dapp's state. This
            // way we can indicate that we are waiting for it to be mined.
            const tx = await this._token.transfer(to, ethers.parseUnits(amount, 18));
            this.setState({ txBeingSent: tx.hash });

            // We use .wait() to wait for the transaction to be mined. This method
            // returns the transaction's receipt.
            const receipt = await tx.wait();

            // The receipt, contains a status flag, which is 0 to indicate an error.
            if (receipt.status === 0) {
                // We can't know the exact error that made the transaction fail when it
                // was mined, so we throw this generic one.
                throw new Error("Transaction failed");
            }

            // If we got here, the transaction was successful, so you may want to
            // update your state. Here, we update the user's balance.
            await this._getTokenData();
        } catch (error) {
            // We check the error code to see if this error was produced because the
            // user rejected a tx. If that's the case, we do nothing.
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }

            // Other errors are logged and stored in the Dapp's state. This is used to
            // show them to the user, and for debugging.
            console.error(error);
            this.setState({ transactionError: error });
        } finally {
            // If we leave the try/catch, we aren't sending a tx anymore, so we clear
            // this part of the state.
            this.setState({ txBeingSent: undefined });
        }
    }

    async _withdrawCredits(amount, tokenId) {
        try {
            const address = this.state.selectedAddress;
            if (!address) {
                return;
            }
            const tx = await this._okeytooPlayer.withdrawCredits(
                address,
                tokenId,
                ethers.parseUnits(amount.toString(), 6)
            );
            this.setState({ txBeingSent: tx.hash });
            await tx.wait();
            await this._getNFTData();
        } catch (error) {
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }
            console.error(error);
            this.setState({ transactionError: error });
        } finally {
            this.setState({ txBeingSent: undefined });
        }
    }

    async _depositOKT(amount) {
        try {
            const { value, deadline, sig } = await this._getDepositParams(this._token, amount);
            const tx = await this._okeytooPlayer.depositOKTWithPermit(value, deadline, sig.v, sig.r, sig.s);
            const hash = tx.hash;
            this.setState({ txBeingSent: tx.hash });
            await tx.wait(); // Block mined
            // Finished
            const postTx = await this._provider.getTransaction(hash);
            console.log(postTx);
            const postReceipt = await this._provider.getTransactionReceipt(hash);
            console.log(postReceipt);

            // api/post/tx.id
        } catch (error) {
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }
            console.error(error);
            this.setState({ transactionError: error });
        } finally {
            this._getMultiSigData();
            this._getUSDTData();
            this._getTokenData();
            this._getNFTData();
            this.setState({ txBeingSent: undefined });
        }
    }

    async _depositUSDT(amount) {
        try {
            const { value, deadline, sig } = await this._getDepositParams(this._usdt, amount);
            const tx = await this._okeytooPlayer.depositUSDTWithPermit(value, deadline, sig.v, sig.r, sig.s);
            this.setState({ txBeingSent: tx.hash });
            await tx.wait();
        } catch (error) {
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }
            console.error(error);
            this.setState({ transactionError: error });
        } finally {
            this._getMultiSigData();
            this._getUSDTData();
            this._getTokenData();
            this._getNFTData();
            this.setState({ txBeingSent: undefined });
        }
    }

    async _getDepositParams(token, amount) {
        const signer = await this._provider.getSigner(0);

        const tokenName = await token.name();
        const tokenAddress = await token.getAddress();
        const nonce = await token.nonces(this.state.selectedAddress);
        // const nonce = await signer.getNonce();
        const owner = signer.address;
        const spender = await this._okeytooPlayer.getAddress();
        const deadline = (await this._provider.getBlock("latest")).timestamp + 5000;
        const decimals = await token.decimals();
        const value = ethers.parseUnits(amount, decimals);

        const domain = {
            name: tokenName,
            version: "1",
            chainId: this.state.chainId,
            verifyingContract: tokenAddress,
        };

        const types = {
            Permit: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" },
                { name: "value", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" },
            ],
        };

        const values = {
            owner: owner,
            spender: spender,
            value: value.toString(),
            nonce: nonce,
            deadline: deadline,
        };

        const sigBytes = await signer.signTypedData(domain, types, values);

        const sig = ethers.Signature.from(sigBytes);
        // const sigBytes = ethers.Signature.from(sig).serialized;
        return { value, deadline, sig };
    }

    // This method just clears part of the state.
    _dismissTransactionError() {
        this.setState({ transactionError: undefined });
    }

    // This method just clears part of the state.
    _dismissNetworkError() {
        this.setState({ networkError: undefined });
    }

    // This is an utility method that turns an RPC error into a human readable
    // message.
    _getRpcErrorMessage(error) {
        if (error.data) {
            return error.data.message;
        }

        return error.message;
    }

    // This method resets the state
    _resetState() {
        this.setState(this.initialState);
    }

    async _switchChain() {
        const chainId = NETWORK_ID;
        const chainIdHex = `0x${chainId.toString(16)}`;
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainIdHex }],
        });
        this.setState({ chainId: chainId });
        await this._initialize(this.state.selectedAddress);
    }

    // This method checks if the selected network is Localhost:8545
    async _checkNetwork() {
        const networkVersion = await window.ethereum.request({
            method: "net_version",
            params: [],
        });
        this.setState({ chainId: networkVersion });
        if (networkVersion !== NETWORK_ID) {
            this._switchChain();
        }
    }
}
