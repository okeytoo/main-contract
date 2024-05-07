const { expect } = require("chai");

const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("MultiSignatureWallet contract", function () {
    async function deployFixture() {
        const Contract = await ethers.getContractFactory("MultiSignatureWallet");
        const [owner] = await ethers.getSigners();
        const multiSigWallet = await Contract.deploy([owner], 1);
        await multiSigWallet.waitForDeployment();
        return { Contract, multiSigWallet, owner };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { multiSigWallet, owner } = await loadFixture(deployFixture);
            expect(await multiSigWallet.isOwner(owner)).to.equal(true);
        });

        it("Should assign the total supply of tokens to the owner", async function () {
            const { multiSigWallet, owner } = await loadFixture(deployFixture);
            const ownerBalance = await multiSigWallet.balanceOf(owner.address);
            expect(await multiSigWallet.totalSupply()).to.equal(ownerBalance);
        });
    });
});
