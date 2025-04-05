const hre = require("hardhat");

async function main() {
  const [deployer, seller, inspector, lender, buyer1, buyer2] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // ------------------------
  // Deploy RealEstate (ERC721)
  // ------------------------
  const RealEstate = await hre.ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy();
  await realEstate.deployed();
  console.log("RealEstate deployed to:", realEstate.address);

  // ------------------------
  // Mint a Property NFT
  // ------------------------
  const mintTxn = await realEstate.connect(seller).mint("https://token-uri.com/property1");
  await mintTxn.wait();
  console.log("NFT minted by seller:", seller.address);

  const nftID = 1;

  // ------------------------
  // Deploy Escrow
  // ------------------------
  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(realEstate.address, seller.address, inspector.address, lender.address);
  await escrow.deployed();
  console.log("Escrow deployed to:", escrow.address);

  // ------------------------
  // Approve and List the Property
  // ------------------------
  const approveTxn = await realEstate.connect(seller).approve(escrow.address, nftID);
  await approveTxn.wait();
  console.log("NFT approved for Escrow");

  const purchasePrice = hre.ethers.utils.parseEther("10"); // 10 ETH total
  const escrowAmount = hre.ethers.utils.parseEther("2");   // Required in escrow

  const listTxn = await escrow.connect(seller).listProperty(nftID, purchasePrice, escrowAmount);
  await listTxn.wait();
  console.log("Property listed in escrow");

  // ------------------------
  // Buyers Invest in Property
  // ------------------------
  const invest1 = await escrow.connect(buyer1).investInProperty(nftID, { value: hre.ethers.utils.parseEther("4") });
  await invest1.wait();
  console.log("Buyer 1 invested 4 ETH");

  const invest2 = await escrow.connect(buyer2).investInProperty(nftID, { value: hre.ethers.utils.parseEther("6") });
  await invest2.wait();
  console.log("Buyer 2 invested 6 ETH");

  // ------------------------
  // Inspection and Approvals
  // ------------------------
  const inspect = await escrow.connect(inspector).updateInspection(nftID, true);
  await inspect.wait();
  console.log("Inspection passed");

  await escrow.connect(seller).approveSale(nftID);
  await escrow.connect(lender).approveSale(nftID);
  await escrow.connect(buyer1).approveSale(nftID);
  await escrow.connect(buyer2).approveSale(nftID);
  console.log("All parties approved");

  // ------------------------
  // Finalize the Sale
  // ------------------------
  const finalize = await escrow.connect(buyer1).finalizeSale(nftID); // anyone can call
  await finalize.wait();
  console.log("Sale finalized and seller paid");

  // ------------------------
  // Simulate Rental Income
  // ------------------------
  const rentIncome = hre.ethers.utils.parseEther("2"); // 2 ETH rent
  const rentTx = await escrow.connect(deployer).distributeRentalIncome(nftID, { value: rentIncome });
  await rentTx.wait();
  console.log("Rental income distributed to fractional investors");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
