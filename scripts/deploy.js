// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const { ethers } = require("hardhat");

const { deployMultiSigWallet } = require("./deployMultiSigWallet");
const { deployOkeytoo } = require("./deployOkeytoo");
const { deployOkeytooPlayer } = require("./deployOkeytooPlayer");
const { readContractAddresses } = require("../utils/readContractAddresses");

// const USDT = "0xC2C527C0CACF457746Bd31B2a698Fe89de2b6d49"; // Goerli
// const USDT = "0xe5b6c29411b3ad31c3613bba0145293fc9957256"; // Arbitrum Sepolia
// const USDT = "0x5492477D2EB825867292483347685580c891627E"; // Manta Pacific Testnet
const USDT = "0xF70e508479f40632fe21aAdCD9018d72087DEAf3"; // Ethereum Sepolia

async function main() {
    // This is just a convenience check
    if (network.name === "hardhat") {
        console.warn(
            "You are trying to deploy a contract to the Hardhat Network, which" +
                "gets automatically created and destroyed every time. Use the Hardhat" +
                " option '--network localhost'"
        );
    }

    const [deployer] = await ethers.getSigners();
    const deployerAddress = deployer.address;
    const deployerBalance = await deployer.provider.getBalance(deployerAddress);

    console.log("Deploying the contracts with the account:", deployerAddress);

    console.log("Account balance: %s ETH", ethers.formatEther(deployerBalance));

    await deployMultiSigWallet();

    const contractAddresses = await readContractAddresses();
    const okeytoo = await deployOkeytoo(contractAddresses.Okeytoo);

    const okeytooAddress = await okeytoo.getAddress();

    await deployOkeytooPlayer(okeytooAddress, USDT);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
