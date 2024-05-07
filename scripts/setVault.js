const { ethers } = require("hardhat");
const { readContractAddresses } = require("../utils/readContractAddresses");

const config = {
    vaultAddress: "0x6747Dfd12c4BA52147be2e4328E360c9F396012c",
};

async function main() {
    const contractAddresses = await readContractAddresses();
    const okeytooPlayer = await ethers.getContractAt("OkeytooPlayer", contractAddresses.OkeytooPlayer);
    const tx = await okeytooPlayer.setVault(config.vaultAddress);
    await tx.wait();
    const vault = await okeytooPlayer.vault();
    console.log(`Vault is set to ${vault}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
