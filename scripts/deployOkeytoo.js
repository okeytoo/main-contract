const { ethers, upgrades } = require("hardhat");
const { saveFrontendFiles } = require("../utils/saveContractArtifact");

require("dotenv").config();

async function deployOkeytoo() {
    const Token = await ethers.getContractFactory("Okeytoo");
    const token = await upgrades.deployProxy(Token, ["Okeytoo", "OKYT", 18]);
    await token.waitForDeployment();

    const tokenAddress = await token.getAddress();
    const tokenContractOwner = await token.owner();
    const tokenName = await token.name();
    const tokenSymbol = await token.symbol();
    const tokenDecimals = ethers.toNumber(await token.decimals());

    const tokenInfo = {
        network: "ARB",
        contract: "Okeytoo",
        address: tokenAddress,
        owner: tokenContractOwner,
        name: tokenName,
        symbol: tokenSymbol,
        decimals: tokenDecimals,
    };

    console.log(tokenInfo);

    saveFrontendFiles(tokenInfo);

    return token;
}

module.exports = { deployOkeytoo };
