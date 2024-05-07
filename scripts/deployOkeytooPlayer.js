const { ethers, upgrades } = require("hardhat");
const { saveFrontendFiles } = require("../utils/saveContractArtifact");

async function deployOkeytooPlayer(oktAddress, usdtAddress) {
    const [deployer] = await ethers.getSigners();
    // const deployerAddress = deployer.address;
    const OkeytooPlayer = await ethers.getContractFactory("OkeytooPlayer");
    const operator = "0xbfb3cEC7b2A44D7ac956Ac6a78881A4C4857204e";

    const okeytooPlayer = await upgrades.deployProxy(OkeytooPlayer, [
        "OkeytooPlayer",
        "OKTP",
        operator,
        "https://api.okeytoo.com/api/v1/nft/",
        oktAddress,
        usdtAddress,
        "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
    ]);
    await okeytooPlayer.waitForDeployment();

    const [
        okeytooPlayerAddress,
        okeytooPlayerContractOwner,
        okeytooPlayerContractOperator,
        okeytooPlayerName,
        okeytooPlayerSymbol,
    ] = await Promise.all([
        okeytooPlayer.getAddress(),
        okeytooPlayer.owner(),
        okeytooPlayer.operator(),
        okeytooPlayer.name(),
        okeytooPlayer.symbol(),
    ]);

    const okeytooPlayerInfo = {
        network: "ARB",
        contract: "OkeytooPlayer",
        address: okeytooPlayerAddress,
        owner: okeytooPlayerContractOwner,
        operator: okeytooPlayerContractOperator,
        name: okeytooPlayerName,
        symbol: okeytooPlayerSymbol,
    };

    console.log(okeytooPlayerInfo);

    saveFrontendFiles(okeytooPlayerInfo);

    return okeytooPlayer;
}

module.exports = { deployOkeytooPlayer };
