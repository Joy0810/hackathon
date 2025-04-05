const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether');
};

describe("Escrow", () => {
    let deployer, seller, inspector, lender, buyer1, buyer2;
    let realEstate, escrow, nftID = 1;

    beforeEach(async () => {
        [deployer, seller, inspector, lender, buyer1, buyer2] = await ethers.getSigners();

        // Deploy NFT contract
        const RealEstate = await ethers.getContractFactory("RealEstate");
        realEstate = await RealEstate.connect(seller).deploy();
        await realEstate.deployed();

        // Mint NFT
        const txn = await realEstate.connect(seller).mint("token-uri-1");
        await txn.wait();

        // Deploy Escrow contract
        const Escrow = await ethers.getContractFactory("Escrow");
        escrow = await Escrow.deploy(
            realEstate.address,
            seller.address,
            inspector.address,
            lender.address
        );
        await escrow.deployed();

        // Approve and list the property before each test
        await realEstate.connect(seller).approve(escrow.address, nftID);
        await escrow.connect(seller).listProperty(nftID, tokens(10), tokens(2));
    });

    describe("Listing", () => {
        it("should list property", async () => {
            const listing = await escrow.listings(nftID);
            expect(listing.isListed).to.be.true;
            expect(await realEstate.ownerOf(nftID)).to.equal(escrow.address);
        });
    });

    describe("Investment", () => {
        it("should allow multiple buyers to invest", async () => {
            await escrow.connect(buyer1).investInProperty(nftID, { value: tokens(5) });
            await escrow.connect(buyer2).investInProperty(nftID, { value: tokens(5) });

            const [contribution1, share1] = await escrow.getBuyerContribution(nftID, buyer1.address);
            const [contribution2, share2] = await escrow.getBuyerContribution(nftID, buyer2.address);

            expect(contribution1).to.equal(tokens(5));
            expect(share1).to.equal(5000); // 50%
            expect(contribution2).to.equal(tokens(5));
            expect(share2).to.equal(5000); // 50%
        });
    });
});
