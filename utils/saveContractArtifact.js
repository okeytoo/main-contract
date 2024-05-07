const path = require("path");

async function saveFrontendFiles(contractInfo) {
    const fs = require("fs");
    const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir);
    }

    const contractName = contractInfo.contract;
    const contractAddress = contractInfo.address;
    let contractAddressJson = {};

    let key = contractName;
    const contractAddressPath = path.join(contractsDir, "contract-address.json");

    if (fs.existsSync(contractAddressPath)) {
        contractAddressJson = JSON.parse(fs.readFileSync(contractAddressPath));
    }

    contractAddressJson[key] = contractAddress;

    fs.writeFileSync(contractAddressPath, JSON.stringify(contractAddressJson, undefined, 2));

    const Artifact = artifacts.readArtifactSync(contractName);

    fs.writeFileSync(path.join(contractsDir, `${key}.json`), JSON.stringify(Artifact, null, 2));
}

module.exports = { saveFrontendFiles };
