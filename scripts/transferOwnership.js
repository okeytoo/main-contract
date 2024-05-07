// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const { ethers } = require("hardhat");
const { readContractAddresses } = require("../utils/readContractAddresses");

async function main() {
    const [deployer] = await ethers.getSigners();
    const deployerAddress = deployer.address;
    const deployerBalance = await deployer.provider.getBalance(deployerAddress);

    console.log("Transferring ownership of the contracts with the account:", deployerAddress);

    console.log("Account balance: %s ETH", ethers.formatEther(deployerBalance));

    const contractAddresses = await readContractAddresses();

    const okeytoo = await ethers.getContractAt("Okeytoo", contractAddresses.Okeytoo);
    const okeytooPlayer = await ethers.getContractAt("OkeytooPlayer", contractAddresses.OkeytooPlayer);

    const transferOwnershipTxs = await Promise.all(
        [okeytoo, okeytooPlayer].map((contract) => contract.transferOwnership(contractAddresses.MultiSignatureWallet))
    );
    await Promise.all(transferOwnershipTxs.map((tx) => tx.wait()));
    console.log(`Ownerships transferred to ${contractAddresses.MultiSignatureWallet}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
