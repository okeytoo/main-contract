const { ethers } = require("hardhat");
const { readContractAddresses } = require("../utils/readContractAddresses");

async function main() {
    const contractAddresses = await readContractAddresses();
    const okeytooPlayer = await ethers.getContractAt("OkeytooPlayer", contractAddresses.OkeytooPlayer);
    const tx = await okeytooPlayer.setOperator("0xbfb3cEC7b2A44D7ac956Ac6a78881A4C4857204e");
    await tx.wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
