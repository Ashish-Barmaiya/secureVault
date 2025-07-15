// app/dashboard/vault/page.js

"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearVaultKey } from "@/store/vaultSlice";
import { useRouter } from "next/navigation";
import { encryptAssetData, decryptAssetData } from "@/utils/vaultCrypto";
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
  Search,
  ChevronDown,
  WalletCards,
  Banknote,
  FileText,
  Key as KeyIcon,
  ShieldCheck,
  Bitcoin,
} from "lucide-react";

const categories = [
  { id: "all", label: "All Assets", count: 4, icon: <Folder size={18} /> },
  { id: "crypto", label: "Crypto", count: 2, icon: <Bitcoin size={18} /> },
  { id: "banking", label: "Banking", count: 1, icon: <Banknote size={18} /> },
  {
    id: "documents",
    label: "Documents",
    count: 1,
    icon: <FileText size={18} />,
  },
  {
    id: "passwords",
    label: "Passwords",
    count: 0,
    icon: <KeyIcon size={18} />,
  },
];

export default function VaultDashboard() {
  const vaultKey = useSelector((state) => state.vault.vaultKey);
  const dispatch = useDispatch();
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(false);
  const [cryptoWallets, setCryptoWallets] = useState([]);
  const [decryptedMap, setDecryptedMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isDecrypting, setIsDecrypting] = useState({});

  // Render page only if vaultKey is available
  useEffect(() => {
    if (!vaultKey) {
      router.replace("/dashboard");
    }
  }, [vaultKey, router]);

  // Function to handle submission of crypto wallet data
  const handleSubmitCryptoWallet = async (walletData) => {
    try {
      console.log("🔒 Wallet data to encrypt:", walletData.secretInfo);
      const jsonToEncrypt = JSON.stringify(walletData.secretInfo);
      console.log("📤 JSON stringified:", jsonToEncrypt);

      const encryptedDataObj = await encryptAssetData(jsonToEncrypt, vaultKey);

      // Combine ciphertext and iv into a single string for storage
      const encryptedData = `${encryptedDataObj.ciphertext}:${encryptedDataObj.iv}`;

      const payload = {
        title: walletData.title,
        publicAddress: walletData.publicAddress,
        network: walletData.network,
        type: "crypto_wallet",
        encryptedData,
        createdAt: new Date().toISOString(),
      };

      const response = await fetch(
        "/api/dashboard/vault/asset/add-crypto-wallet",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save wallet");
      }

      const result = await response.json();
      console.log("Wallet saved successfully:", result);
      fetchCryptoWallets();
    } catch (error) {
      console.error("Error saving wallet:", error);
      // Optional: Show user error toast
    }
  };
  const fetchCryptoWallets = async () => {
    try {
      const res = await fetch("/api/dashboard/vault/asset/crypto-wallet");
      if (!res.ok) throw new Error("Failed to fetch crypto wallets");

      const resJson = await res.json();
      // Map server data to expected frontend structure
      const wallets = (resJson?.data || []).map((wallet) => ({
        id: wallet.id,
        title: wallet.label || "Unnamed Wallet",
        publicAddress: wallet.publicAddress,
        network: wallet.network,
        encryptedData: wallet.encryptedData, // Keep as colon-separated string
        createdAt: wallet.createdAt || new Date().toISOString(),
      }));

      setCryptoWallets(wallets);
    } catch (error) {
      console.error("Error fetching wallets:", error);
    }
  };

  useEffect(() => {
    if (vaultKey) fetchCryptoWallets();
  }, [vaultKey]);

  const handleDecrypt = async (walletId, encryptedDataString) => {
    setIsDecrypting((prev) => ({ ...prev, [walletId]: true }));

    try {
      const [ciphertext, iv] = encryptedDataString.split(":");

      console.log("📦 Encrypted String:", encryptedDataString);
      console.log("🔓 Ciphertext:", ciphertext);
      console.log("🔓 IV:", iv);

      const decryptedString = await decryptAssetData(
        { ciphertext, iv },
        vaultKey
      );

      console.log("✅ Decrypted String:", decryptedString);

      const parsed = JSON.parse(decryptedString); // crashing here

      setDecryptedMap((prev) => ({
        ...prev,
        [walletId]: parsed,
      }));
    } catch (error) {
      console.error("❌ Decryption error:", error);
      alert("Failed to decrypt data.\n\n" + error.message);
    } finally {
      setIsDecrypting((prev) => ({ ...prev, [walletId]: false }));
    }
  };

  const handleLockVault = () => {
    dispatch(clearVaultKey());
    router.replace("/dashboard");
  };

  const filteredWallets = cryptoWallets.filter((wallet) => {
    // Filter by search query
    const matchesSearch =
      wallet.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallet.publicAddress?.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by category (currently only crypto exists)
    const matchesCategory =
      selectedCategory === "all" || selectedCategory === "crypto";

    return matchesSearch && matchesCategory;
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Optionally show a toast notification
  };

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-[#0A101F] via-[#0F172A] to-[#0A101F] text-white">
      {/* Header */}
      <header className="p-4 border-b border-blue-800/30 bg-[#0A101F]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Sidebar toggle button for mobile */}
            <button
              onClick={() => setShowSidebar((prev) => !prev)}
              className="lg:hidden text-white p-2"
            >
              {showSidebar ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Vault size={22} className="text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">Secure Vault</h1>
            </div>

            {/* Search bar */}
            <div className="relative flex-1 max-w-md ml-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 bg-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] hover:bg-[#2D3748] text-white rounded-lg text-sm transition-colors"
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>

            <AddAssetButton onSubmitCryptoWallet={handleSubmitCryptoWallet} />

            <button
              onClick={handleLockVault}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg shadow text-sm transition-all"
            >
              <Lock size={16} />
              Lock Vault
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row gap-6 p-4 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <div
          className={`${
            showSidebar ? "block" : "hidden"
          } lg:block w-full lg:w-64 bg-[#0F172A] p-5 rounded-2xl shadow-lg border border-gray-800 h-fit lg:sticky lg:top-24`}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Folder size={20} /> Categories
          </h2>
          <ul className="space-y-2">
            {categories.map((category) => (
              <li
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex justify-between items-center p-3 rounded-xl text-sm cursor-pointer transition-all ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-500/30"
                    : "bg-[#1E293B] hover:bg-[#2D3748]"
                }`}
              >
                <span className="flex items-center gap-2">
                  {category.icon}
                  {category.label}
                </span>
                <span className="bg-blue-600 px-2 py-0.5 rounded-full text-xs min-w-[28px] text-center">
                  {category.count}
                </span>
              </li>
            ))}
          </ul>

          {/* Security Status */}
          <div className="mt-8 p-4 bg-[#1E293B] rounded-xl border border-green-700/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-600/20 p-1.5 rounded-lg">
                <ShieldCheck size={18} className="text-green-400" />
              </div>
              <h3 className="font-medium">Security Status</h3>
            </div>
            <p className="text-xs text-gray-400">
              Vault is secured with AES-256 encryption. All data is end-to-end
              encrypted.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <section className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <WalletCards size={22} />
              {selectedCategory === "all"
                ? "All Assets"
                : categories.find((c) => c.id === selectedCategory)?.label}
              <span className="text-sm bg-blue-600 px-2 py-0.5 rounded-full ml-2">
                {filteredWallets.length}
              </span>
            </h2>

            <div className="flex items-center gap-2 text-sm">
              <span>Sort by:</span>
              <div className="relative">
                <select className="bg-[#0F172A] border border-gray-700 rounded-lg pl-3 pr-8 py-1.5 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-600">
                  <option>Newest</option>
                  <option>Oldest</option>
                  <option>A-Z</option>
                </select>
                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          </div>

          {filteredWallets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-[#0F172A] rounded-2xl border border-gray-800">
              <div className="bg-blue-600/20 p-4 rounded-full mb-4">
                <Vault size={40} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No assets found</h3>
              <p className="text-gray-400 max-w-md mb-6">
                {searchQuery
                  ? "No assets match your search. Try different keywords."
                  : "You haven't added any assets yet. Start by adding your first item to your vault."}
              </p>
              <AddAssetButton onSubmitCryptoWallet={handleSubmitCryptoWallet} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredWallets.map((wallet) => {
                const decrypted = decryptedMap[wallet.id];
                const isDecryptingThis = isDecrypting[wallet.id];

                return (
                  <div
                    key={wallet.id}
                    className="bg-gradient-to-b from-[#0F172A] to-[#0A101F] border border-blue-800/30 rounded-2xl p-5 shadow-lg overflow-hidden transition-transform hover:-translate-y-1"
                  >
                    {/* Card header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="bg-blue-600/20 p-1.5 rounded-lg">
                            <Bitcoin size={18} className="text-blue-400" />
                          </div>
                          <h3 className="text-lg font-semibold">
                            {wallet.title || "Unnamed Wallet"}
                          </h3>
                        </div>
                        <div className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded-full inline-block">
                          {wallet.network}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
                          <Edit size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-800">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Public address */}
                    <div className="mb-4">
                      <div className="text-xs text-gray-400 mb-1">
                        Public Address
                      </div>
                      <div className="flex items-center justify-between bg-[#1E293B] p-3 rounded-lg">
                        <div className="text-sm font-mono truncate">
                          {wallet.publicAddress}
                        </div>
                        <button
                          onClick={() => copyToClipboard(wallet.publicAddress)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Sensitive info section */}
                    <div className="border-t border-gray-800 pt-4">
                      {decrypted ? (
                        <>
                          <div className="mb-3">
                            <div className="text-xs text-gray-400 mb-1">
                              Private Key
                            </div>
                            <div className="flex items-center justify-between bg-[#1E293B] p-3 rounded-lg">
                              <div className="text-sm font-mono truncate">
                                {decrypted.privateKey}
                              </div>
                              <button
                                onClick={() =>
                                  copyToClipboard(decrypted.privateKey)
                                }
                                className="text-gray-400 hover:text-white"
                              >
                                <Copy size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="text-xs text-gray-400 mb-1">
                              Seed Phrase
                            </div>
                            <div className="bg-[#1E293B] p-3 rounded-lg">
                              <div className="text-sm font-mono break-words">
                                {decrypted.seedPhrase}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                copyToClipboard(decrypted.privateKey)
                              }
                              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                            >
                              Copy Private Key
                            </button>

                            <button
                              onClick={() =>
                                setDecryptedMap((prev) => {
                                  const newMap = { ...prev };
                                  delete newMap[wallet.id];
                                  return newMap;
                                })
                              }
                              className="flex-1 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm transition-colors"
                            >
                              Hide
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() =>
                            handleDecrypt(wallet.id, wallet.encryptedData)
                          }
                          disabled={isDecryptingThis}
                          className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                            isDecryptingThis
                              ? "bg-blue-700 cursor-not-allowed"
                              : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                          }`}
                        >
                          {isDecryptingThis ? (
                            <>
                              <svg
                                className="animate-spin h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Decrypting...
                            </>
                          ) : (
                            <>
                              <Eye size={16} />
                              Reveal Sensitive Info
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-sm text-gray-500 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-green-500" />
                <span>End-to-end encrypted</span>
              </div>
              <div className="w-px h-4 bg-gray-700"></div>
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-blue-500" />
                <span>AES-256 encryption</span>
              </div>
            </div>

            <div>
              © {new Date().getFullYear()} SecureVault. Securely manage your
              digital life.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
