"use client";

import { useState } from "react";
import { ethers } from "ethers";

export default function Home() {
  const [wallet, setWallet] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getBalance = async () => {
    if (!wallet) return alert("Please paste a wallet address first!");
    try {
      setLoading(true);
      const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
      const balanceWei = await provider.getBalance(wallet);
      const balanceEth = ethers.formatEther(balanceWei);
      setBalance(balanceEth);
    } catch (err: any) {
      console.error("RPC Error:", err);
      alert(`Error fetching balance: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#200052] to-[#0E100F] text-[#FBFAF9] p-6">
      
      <img
        src="/monad-logo.png"
        alt="Monad Logo"
        className="w-20 h-20 mb-4 opacity-90"
      />

      <h1 className="text-4xl font-extrabold mb-4 text-[#836EF9]">
        Monad Wallet Viewer
      </h1>
      <p className="text-[#FBFAF9]/80 mb-8 text-center max-w-md">
        Check your Monad Testnet balance instantly. Paste your address below and
        view your current MON holdings.
      </p>

      <div className="bg-[#0E100F]/60 backdrop-blur-lg border border-[#836EF9]/30 rounded-2xl p-6 w-80 shadow-lg flex flex-col items-center">
        <input
          type="text"
          placeholder="Paste wallet address (0x...)"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          className="p-3 w-full text-white rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#836EF9]"
        />

        <button
          onClick={getBalance}
          disabled={loading}
          className="bg-[#836EF9] hover:bg-[#A0055D] transition-all font-semibold text-white px-6 py-3 rounded-xl w-full shadow-md"
        >
          {loading ? "Loading..." : "Check Balance"}
        </button>

        {balance && (
          <div className="mt-6 text-lg font-medium text-[#FBFAF9]">
            Balance: <span className="text-[#836EF9]">{balance} MON</span>
          </div>
        )}
      </div>

      <footer className="mt-10 text-sm text-[#FBFAF9]/50">
        Built with ❤️ for Monad Testnet
      </footer>
    </main>
  );
}
