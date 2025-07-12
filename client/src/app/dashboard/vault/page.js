// app/dashboard/vault/page.js

"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearVaultKey } from "@/store/vaultSlice";
import { useRouter } from "next/navigation";
import { encryptAssetData } from "@/utils/vaultCrypto";
import AddAssetButton from "@/components/AddAssetButton";
import {
  Vault,
  Eye,
  Copy,
  Edit,
  Trash2,
  Folder,
  Plus,
  Lock,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";

const categories = [
  { label: "All Assets", count: 4 },
  { label: "Crypto", count: 2 },
  { label: "Banking", count: 1 },
  { label: "Documents", count: 1 },
  { label: "Passwords", count: 0 },
];

const assets = [
  {
    id: 1,
    name: "MetaMask Wallet",
    category: "Crypto Wallet",
    updated: "2 days ago",
    fields: [
      { label: "Address", value: "0x742d..." },
      { label: "Private Key", value: "*************" },
      { label: "Seed Phrase", value: "*************" },
    ],
  },
  {
    id: 2,
    name: "Chase Bank Account",
    category: "Bank Account",
    updated: "1 week ago",
    fields: [
      { label: "Username", value: "john.doe@email.com" },
      { label: "Password", value: "********" },
      { label: "Account Number", value: "••••••1234" },
    ],
  },
];

export default function VaultDashboard() {
  const vaultKey = useSelector((state) => state.vault.vaultKey);
  const dispatch = useDispatch();
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(false);

  // Rendetr page only if vaultKey is available
  useEffect(() => {
    if (!vaultKey) {
      router.replace("/dashboard");
    }
  }, [vaultKey, router]);

  // Function to handle submission of crypto wallet data
  const handleSubmitCryptoWallet = async (walletData) => {
    try {
      // Encrypt the sensitive wallet data
      const encryptedData = encryptAssetData(
        walletData.secretInfo, // Only encrypt the sensitive parts
        vaultKey // This should be your current vault key
      );

      // Prepare the data for API submission
      const payload = {
        title: walletData.title,
        publicAddress: walletData.publicAddress,
        network: walletData.network,
        type: "crypto_wallet", // Add asset type for backend
        encryptedData: encryptedData,
        createdAt: new Date().toISOString(),
      };

      // Send to API endpoint
      const response = await fetch(
        "/api/dashboard/vault/asset/add-crypto-wallet",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save wallet");
      }

      const result = await response.json();
      console.log("Wallet saved successfully:", result);
    } catch (error) {
      console.error("Error saving wallet:", error);
      // Handle error (e.g., show notification to user)
    }
  };

  const handleLockVault = () => {
    dispatch(clearVaultKey());
    router.replace("/dashboard");
  };

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-[#0f172a] to-black text-white">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center p-4 border-b border-blue-800/50">
        <div className="flex items-center gap-4">
          {/* Sidebar toggle button for mobile */}
          <button
            onClick={() => setShowSidebar((prev) => !prev)}
            className="lg:hidden text-white p-2"
          >
            {showSidebar ? <X size={24} /> : <Menu size={24} />}
          </button>

          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Vault size={22} /> Your Secure Vault
          </h1>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-800 text-white rounded-lg text-sm"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>

          <AddAssetButton onSubmitCryptoWallet={handleSubmitCryptoWallet} />

          <button
            onClick={handleLockVault}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow text-sm"
          >
            <Lock size={16} />
            Lock Vault
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row gap-4 p-4">
        {/* Sidebar */}
        <div
          className={`${
            showSidebar ? "block" : "hidden"
          } lg:block w-full lg:w-64 bg-[#1e293b] p-5 rounded-2xl shadow-lg`}
        >
          <h2 className="text-lg font-semibold mb-4">Categories</h2>
          <ul className="space-y-3">
            {categories.map((cat, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between bg-[#0f172a] hover:bg-[#1c2a42] p-3 rounded-xl transition text-sm"
              >
                <span className="flex items-center gap-2">
                  <Folder size={16} />
                  {cat.label}
                </span>
                <span className="bg-blue-600 px-2 py-0.5 rounded-full text-xs">
                  {cat.count}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Vault Assets Section */}
        <section className="flex-1 space-y-6 sm:space-y-8">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-[#0f172a] border border-blue-800/60 rounded-2xl p-5 sm:p-6 shadow-md"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold">
                    {asset.name}
                  </h3>
                  <div className="text-xs text-blue-400 mt-1">
                    {asset.category} • Updated {asset.updated}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-blue-900 rounded-lg transition">
                    <Edit size={16} />
                  </button>
                  <button className="p-2 hover:bg-red-900 rounded-lg transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {asset.fields.map((field, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#1e293b] p-4 rounded-xl mb-3 gap-2"
                >
                  <div>
                    <div className="text-sm text-gray-300">{field.label}</div>
                    <div className="font-mono text-lg">{field.value}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="hover:text-blue-400">
                      <Eye size={16} />
                    </button>
                    <button className="hover:text-blue-400">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-4 text-center text-sm text-gray-400 border-t border-zinc-800">
        © {new Date().getFullYear()} SecureVault. Securely manage your digital
        life.
      </footer>
    </main>
  );
}
