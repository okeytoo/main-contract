const { ethers } = require("hardhat");
const { saveFrontendFiles } = require("../utils/saveContractArtifact");

require("dotenv").config();

const contract = "TetherToken";

async function main() {
    const [deployer] = await ethers.getSigners();
    const deployerAddress = deployer.address;
    const deployerBalance = await deployer.provider.getBalance(deployerAddress);

    console.log(`Deploying ${contract} the account: ${deployerAddress}`);

    console.log("Account balance: %s ETH", ethers.formatEther(deployerBalance));

    const Token = await ethers.getContractFactory(contract);
    const token = await Token.deploy();
    await token.waitForDeployment();

    const tokenAddress = await token.getAddress();
    const tokenName = await token.name();
    const tokenSymbol = await token.symbol();
    const tokenDecimals = ethers.toNumber(await token.decimals());

    const tokenInfo = {
        network: "ARB",
        contract: contract,
        address: tokenAddress,
        name: tokenName,
        symbol: tokenSymbol,
        decimals: tokenDecimals,
    };

    console.log(tokenInfo);

    saveFrontendFiles(tokenInfo);

    return token;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
