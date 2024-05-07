const { ethers } = require("hardhat");
const { readContractAddresses } = require("../utils/readContractAddresses");

const config = {
    pair: "0x0",
    buyFee: 1,
    sellFee: 2,
    usdtFeePercentage: 15,
    oktFeePercentage: 10,
    vaultFeePercentage: 2,
};

async function main() {
    const contractAddresses = await readContractAddresses();
    // const okeytoo = await ethers.getContractAt("Okeytoo", contractAddresses.Okeytoo);
    const okeytooPlayer = await ethers.getContractAt("OkeytooPlayer", contractAddresses.OkeytooPlayer);
    // let tx = await okeytoo.setFees(config.pair, config.buyFee, config.sellFee);
    // await tx.wait();
    let tx = await okeytooPlayer.setFees(config.usdtFeePercentage, config.oktFeePercentage, config.vaultFeePercentage);
    await tx.wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
