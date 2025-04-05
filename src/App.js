import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import WalletConnect from './components/WalletConnect';
import PropertyCard from './components/PropertyCard';

// ABIs
import RealEstate from './abis/RealEstate.json';
import Escrow from './abis/Escrow.json';

// Config
import config from './config.json';

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [realEstateContract, setRealEstateContract] = useState(null);
  const [escrowContract, setEscrowContract] = useState(null);
  const [properties, setProperties] = useState([]);

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);

    const signer = provider.getSigner();
    setSigner(signer);

    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);

    const network = await provider.getNetwork();
    const realEstate = new ethers.Contract(
      config[network.chainId].realEstate.address,
      RealEstate.abi,
      signer
    );
    setRealEstateContract(realEstate);

    const escrow = new ethers.Contract(
      config[network.chainId].escrow.address,
      Escrow.abi,
      signer
    );
    setEscrowContract(escrow);

    const totalSupply = await realEstate.totalSupply();
    const items = [];
    for (let i = 1; i <= totalSupply; i++) {
      const uri = await realEstate.tokenURI(i);
      const res = await fetch(uri);
      const metadata = await res.json();

      const listing = await escrow.listings(i);

      items.push({
        id: i,
        ...metadata,
        price: ethers.utils.formatUnits(listing.purchasePrice, 'ether'),
        listed: listing.isListed
      });
    }

    setProperties(items);
  };

  // i was here

  useEffect(() => {
    loadBlockchainData();
  }, []);

  return (
    <div className="p-6">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-6">Millow Real Estate dApp</h1>
        <WalletConnect account={account} setAccount={setAccount} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            escrow={escrowContract}
            signer={signer}
            account={account}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
