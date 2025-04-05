const hre = require("hardhat");

async function main() {
  // Get signers: deployer, seller, inspector, lender, and optionally buyers.
  const [deployer, seller, inspector, lender, buyer1, buyer2] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // ------------------------
  // Deploy RealEstate Contract
  // ------------------------
  const RealEstate = await hre.ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy();
  await realEstate.deployed();
  console.log("RealEstate deployed to:", realEstate.address);

  // ------------------------
  // Mint an NFT (Property)
  // ------------------------
  // The seller mints the property NFT
  const mintTxn = await realEstate.connect(seller).mint("https://token-uri.com/1");
  await mintTxn.wait();
  console.log("NFT minted by seller:", seller.address);

  // For simplicity, we assume the minted NFT has token ID 1
  const nftID = 1;

  // ------------------------
  // Deploy Escrow Contract
  // ------------------------
  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(
    realEstate.address,
    seller.address,
    inspector.address,
    lender.address
  );
  await escrow.deployed();
  console.log("Escrow deployed to:", escrow.address);

  // ------------------------
  // Approve NFT transfer to Escrow and List the Property
  // ------------------------
  // Seller approves the Escrow contract to transfer the NFT
  const approveTxn = await realEstate.connect(seller).approve(escrow.address, nftID);
  await approveTxn.wait();
  console.log("NFT approved for escrow");

  // Set purchase price and escrow amount
  const purchasePrice = hre.ethers.utils.parseUnits("10", "ether");
  const escrowAmount = hre.ethers.utils.parseUnits("2", "ether");

  // Seller lists the property on the Escrow contract
  const listTxn = await escrow.connect(seller).listProperty(nftID, purchasePrice, escrowAmount);
  await listTxn.wait();
  console.log("Property listed in escrow with purchase price:", purchasePrice.toString(), "and escrow amount:", escrowAmount.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
