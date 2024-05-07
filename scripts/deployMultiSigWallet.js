const { ethers } = require("hardhat");
const { saveFrontendFiles } = require("../utils/saveContractArtifact");

async function deployMultiSigWallet() {
    const [deployer] = await ethers.getSigners();
    const deployerAddress = deployer.address;
    const MultiSigWallet = await ethers.getContractFactory("MultiSignatureWallet");
    const multiSigWallet = await MultiSigWallet.deploy([deployerAddress], 1);

    await multiSigWallet.waitForDeployment();

    const multiSigContractAddress = await multiSigWallet.getAddress();
    const owners = await multiSigWallet.getOwners();
    const transactionCount = await multiSigWallet.getTransactionCount();
    const numConfirmationsRequired = await multiSigWallet.numConfirmationsRequired();

    const multiSigWalletInfo = {
        network: "ARB",
        contract: "MultiSignatureWallet",
        address: multiSigContractAddress,
        owners: owners,
        transactionCount: transactionCount,
        numConfirmationsRequired: numConfirmationsRequired,
    };

    console.log(multiSigWalletInfo);

    saveFrontendFiles(multiSigWalletInfo, network);

    return multiSigWallet;
}

module.exports = { deployMultiSigWallet };
