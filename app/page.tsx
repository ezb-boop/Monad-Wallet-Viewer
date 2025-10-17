"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function Home() {
  const [wallet, setWallet] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [txCount, setTxCount] = useState<number | null>(null);
  const [lastTxDate, setLastTxDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [displayBalance, setDisplayBalance] = useState(0);

  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");

  // Animación de conteo para balance
  useEffect(() => {
    if (balance === null) return;
    let start = 0;
    const duration = 800; // ms
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

  // Obtener info de wallet
  const getBalance = async () => {
    if (!wallet) return alert("Por favor pega una dirección de wallet primero.");
    try {
      setLoading(true);

      // Balance
      const balanceWei = await provider.getBalance(wallet);
      const balanceEth = parseFloat(ethers.formatEther(balanceWei));
      setBalance(balanceEth);

      // Número de transacciones
      const txCnt = await provider.getTransactionCount(wallet);
      setTxCount(txCnt);

      // Última transacción (no disponible por ahora en testnet)
      setLastTxDate("Unavailable on testnet");

    } catch (err: any) {
      console.error("Error RPC:", err);
      alert(`Error obteniendo datos: ${err?.message ?? err}`);
    } finally {
      setLoading(false);
    }
  };

  const getDynamicMessage = () => {
    if (balance === null) return "";
    if (balance === 0) return "0 MON? What are you waiting for to grab some? 🪙";
    if (balance < 100) return "Not bad, but you can always stack a bit more 💪";
    return "Whale mode activated 🐋 Keep stacking MON!";
  };

  const handleShare = () => {
    const text = `💰 Monad Wallet Stats:
Balance: ${balance?.toFixed(4)} MON
Tx Count: ${txCount ?? "—"}
${getDynamicMessage()}
#Monad #Crypto`;
    try {
      navigator.clipboard.writeText(text);
      alert("Copied wallet summary! Ready to share on X 🪩");
    } catch {
      alert("No se pudo copiar al portapapeles. Copia manualmente:\n\n" + text);
    }
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

      <h1 className="text-4xl font-extrabold mb-4 text-[#836EF9]">
        Monad Wallet Viewer
      </h1>
      <p className="opacity-80 mb-8 text-center max-w-md">
        Check your Monad Testnet balance instantly. Paste your address below and
        view your current MON holdings.
      </p>

      <div
        className={`${
          darkMode ? "bg-[#0E100F]/60" : "bg-white/60"
        } backdrop-blur-lg border border-[#836EF9]/30 rounded-2xl p-6 w-80 shadow-lg flex flex-col items-center transition-all`}
      >
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
          <div className="mt-6 w-full text-center animate-fade-in">
            <div className="text-lg font-medium">
              Balance:{" "}
              <span className="text-[#836EF9]">{displayBalance} MON</span>
            </div>
            <p className="text-sm opacity-80 mt-2">{getDynamicMessage()}</p>

            <div className="mt-4 space-y-2 text-sm">
              <div>Transactions: {txCount ?? "—"}</div>
              <div>Last Tx: {lastTxDate ?? "—"}</div>
              <div>NFTs Held: Unavailable on testnet</div>
            </div>

            {(txCount ?? 0) > 10 ? (
              <div className="mt-3 text-xl">🏅</div>
            ) : null}

            <button
              onClick={handleShare}
              className="mt-5 text-sm bg-[#836EF9]/30 hover:bg-[#836EF9]/50 px-4 py-2 rounded-lg transition-all"
            >
              Share Stats on X
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

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease forwards;
        }
      `}</style>
    </main>
  );
}
