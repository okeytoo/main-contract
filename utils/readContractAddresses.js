const fs = require("fs");
const path = require("path");

async function readContractAddresses() {
    const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
    const contractAddressPath = path.join(contractsDir, "contract-address.json");
    if (!fs.existsSync(contractAddressPath)) {
        throw new Error("contract-addresses.json is not found");
    }
    return JSON.parse(fs.readFileSync(contractAddressPath));
}

module.exports = { readContractAddresses };
