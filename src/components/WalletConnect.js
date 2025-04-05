import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function WalletConnect() {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    if (window.ethereum && window.ethereum.selectedAddress) {
      setAccount(window.ethereum.selectedAddress);
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (err) {
        console.error("User rejected the request");
      }
    } else {
      alert("MetaMask is not installed");
    }
  };

  return (
    <div className="p-4 rounded-xl shadow-md border w-fit">
      {account ? (
        <p className="text-green-600">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
      ) : (
        <button
          onClick={connectWallet}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
