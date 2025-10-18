"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Home() {
  const [wallet, setWallet] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [txCount, setTxCount] = useState<number | null>(null);
  const [lastTxDate, setLastTxDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [displayBalance, setDisplayBalance] = useState(0);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [addresses, setAddresses] = useState("");
  const [amount, setAmount] = useState("");
  const [divideMode, setDivideMode] = useState(false);

  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");

  // ✅ Ensure MetaMask is on Monad Testnet
  const ensureMonadNetwork = async () => {
    const targetChainId = "0x279f"; // 20143 in hex
    try {
      const currentChain = await window.ethereum.request({
        method: "eth_chainId",
      });
      if (currentChain !== targetChainId) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: targetChainId }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: targetChainId,
                  chainName: "Monad Testnet",
                  rpcUrls: ["https://testnet-rpc.monad.xyz"],
                  nativeCurrency: {
                    name: "Monad",
                    symbol: "MON",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://testnet.monadscan.io"],
                },
              ],
            });
          } else throw switchError;
        }
      }
    } catch (err) {
      console.error("❌ Error ensuring Monad network:", err);
      alert("Could not switch to Monad Testnet. Please check MetaMask.");
      throw err;
    }
  };

  // 💫 Balance animation
  useEffect(() => {
    if (balance === null) return;
    let start = 0;
    const duration = 800;
    const stepTime = 16;
    const steps = Math.max(1, Math.floor(duration / stepTime));
    const increment = balance / steps;

    const interval = setInterval(() => {
      start += increment;
      if (start >= balance) {
        setDisplayBalance(Number(balance.toFixed(4)));
        clearInterval(interval);
      } else {
        setDisplayBalance(Number(start.toFixed(4)));
      }
    }, stepTime);
    return () => clearInterval(interval);
  }, [balance]);

  // 🔗 Connect MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask first.");
    try {
      await ensureMonadNetwork(); // 👈 enforce correct network

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []); // trigger MetaMask popup
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();

      setConnectedWallet(address);
      setWallet(address);
      alert(`✅ Wallet connected: ${address}`);
    } catch (err: any) {
      console.error(err);
      alert(`❌ Failed to connect wallet: ${err.message}`);
    }
  };

  // 📊 Get wallet data
  const getBalance = async () => {
    if (!wallet) return alert("Please paste or connect a wallet address first.");
    try {
      setLoading(true);
      const balanceWei = await provider.getBalance(wallet);
      const balanceEth = parseFloat(ethers.formatEther(balanceWei));
      setBalance(balanceEth);

      const txCnt = await provider.getTransactionCount(wallet);
      setTxCount(txCnt);
      setLastTxDate("Unavailable on testnet");
    } catch (err: any) {
      console.error(err);
      alert(`Error fetching data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Send MON to multiple addresses
  const handleSend = async () => {
    if (!connectedWallet) return alert("Connect your wallet first!");
    if (!amount || parseFloat(amount) <= 0) return alert("Enter a valid amount");
    if (!addresses.trim()) return alert("Enter at least one address");

    const recipients = addresses
      .split(/\s|,|\n/)
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    const invalid = recipients.filter((a) => !ethers.isAddress(a));
    if (invalid.length > 0)
      return alert(`❌ Invalid addresses:\n${invalid.join("\n")}`);

    const totalAmount = parseFloat(amount);
    const perWalletAmount = divideMode
      ? (totalAmount / recipients.length).toFixed(6)
      : totalAmount.toString();

    if (
      !window.confirm(
        `Send ${
          divideMode
            ? `${perWalletAmount} MON to each (${totalAmount} total)`
            : `${totalAmount} MON to all (${totalAmount * recipients.length} total)`
        }?`
      )
    )
      return;

    try {
      await ensureMonadNetwork(); // 👈 ensure network before sending
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();

      for (const to of recipients) {
        const tx = await signer.sendTransaction({
          to,
          value: ethers.parseEther(perWalletAmount),
        });
        console.log(`✅ Sent to ${to}: ${tx.hash}`);
      }

      alert(`🚀 Successfully sent MON to ${recipients.length} addresses!`);
    } catch (err: any) {
      console.error("TX Error:", err);
      alert(`❌ Transaction failed: ${err.message}`);
    }
  };

  const getDynamicMessage = () => {
    if (balance === null) return "";
    if (balance === 0) return "0 MON? Go grab some from the faucet 🪙";
    if (balance < 100) return "Not bad, but you can always stack a bit more 💪";
    return "Whale mode activated 🐋 Keep stacking MON!";
  };

  return (
    <main
      className={`min-h-screen flex flex-col items-center justify-center transition-all duration-500 ${
        darkMode
          ? "bg-gradient-to-b from-[#200052] to-[#0E100F] text-[#FBFAF9]"
          : "bg-gradient-to-b from-[#E6E6FA] to-[#F0F0F0] text-[#0E100F]"
      } p-6`}
    >
      <img
        src="/monad-logo.png"
        alt="Monad Logo"
        className="w-20 h-20 mb-4 opacity-90 animate-fade-in"
      />
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 text-[#836EF9] text-center leading-tight">
        Monad Wallet Tool
      </h1>
      <p className="text-sm opacity-80 mb-6 text-center">
        A simple tool to view wallet info and send MON to multiple addresses 
      </p>

      <div
        className={`${
          darkMode ? "bg-[#0E100F]/60" : "bg-white/60"
        } backdrop-blur-lg border border-[#836EF9]/30 rounded-2xl p-6 w-80 shadow-lg flex flex-col items-center transition-all`}
      >
        <button
          onClick={connectWallet}
          className="mb-4 w-full bg-[#836EF9]/40 hover:bg-[#836EF9]/60 py-2 rounded-lg font-semibold transition-all"
        >
          {connectedWallet
            ? `✅ Connected: ${connectedWallet.slice(0, 6)}...${connectedWallet.slice(-4)}`
            : "🔗 Connect Wallet"}
        </button>

        <input
          type="text"
          placeholder="Paste wallet address (0x...)"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          className={`p-3 w-full rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#836EF9] ${
            darkMode ? "bg-[#1A1A1A] text-white" : "bg-white text-black"
          }`}
        />

        <button
          onClick={getBalance}
          disabled={loading}
          className="bg-[#836EF9] hover:bg-[#A0055D] transition-all font-semibold text-white px-6 py-3 rounded-xl w-full shadow-md"
        >
          {loading ? "Loading..." : "Check Wallet"}
        </button>

        {balance !== null && (
          <div className="mt-6 text-center animate-fade-in">
            <div className="text-lg font-medium">
              Balance: <span className="text-[#836EF9]">{displayBalance} MON</span>
            </div>
            <p className="text-sm opacity-80 mt-2">{getDynamicMessage()}</p>
          </div>
        )}

        {connectedWallet && (
          <div className="mt-8 w-full border-t border-[#836EF9]/20 pt-4">
            <h2 className="text-lg font-semibold text-[#836EF9] mb-3 text-center">
              Send MON
            </h2>
            <textarea
              placeholder="Paste wallet addresses (one per line)"
              value={addresses}
              onChange={(e) => setAddresses(e.target.value)}
              className={`w-full p-3 rounded-lg text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#836EF9] ${
                darkMode ? "bg-[#1A1A1A] text-white" : "bg-white text-black"
              }`}
            />
            <input
              type="number"
              placeholder="Amount (MON)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`mt-3 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#836EF9] ${
                darkMode ? "bg-[#1A1A1A] text-white" : "bg-white text-black"
              }`}
            />

            <label className="flex items-center gap-2 text-sm mt-2">
              <input
                type="checkbox"
                checked={divideMode}
                onChange={() => setDivideMode(!divideMode)}
              />
              Divide total amount between wallets
            </label>

            <button
              onClick={handleSend}
              className="mt-4 bg-[#836EF9] hover:bg-[#A0055D] w-full py-2 rounded-lg text-white font-semibold transition-all"
            >
              🚀 Send
            </button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="text-sm opacity-70 hover:opacity-100 transition-all"
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <footer className="mt-10 text-sm opacity-60">
        Built with ❤️ for Monad Testnet
      </footer>
    </main>
  );
}
