require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config({ path: __dirname + "/.env" });

require("./tasks/accounts");

module.exports = {
    solidity: "0.8.20",
    defaultNetwork: "sepolia",
    etherscan: {
        apiKey: process.env.ARBISCAN_KEY,
        // apiKey: process.env.ETHERSCAN_KEY,
    },
    networks: {
        hardhat: {
            forking: {
                url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
            },
        },
        goerli: {
            url: process.env.ETHEREUM_GOERLI_RPC,
            accounts: [process.env.DEVNET_PRIVKEY],
        },
        sepolia: {
            url: process.env.ETHEREUM_SEPOLIA_RPC,
            accounts: [process.env.DEVNET_PRIVKEY],
        },
        L1: {
            url: process.env.L1RPC,
            accounts: [process.env.DEVNET_PRIVKEY],
        },
    },
};
