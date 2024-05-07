const { ethers } = require("hardhat");
const { readContractAddresses } = require("../utils/readContractAddresses");

const directSwapEnabled = false;

async function main() {
    const contractAddresses = await readContractAddresses();
    const okeytooPlayer = await ethers.getContractAt("OkeytooPlayer", contractAddresses.OkeytooPlayer);
    const tx = await okeytooPlayer.setDirectSwapEnabled(directSwapEnabled);
    await tx.wait();
    console.log(`Direct swap enabled to ${directSwapEnabled}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
