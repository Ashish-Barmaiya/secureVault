"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearVaultKey } from "@/store/vaultSlice";
import { useRouter } from "next/navigation";
import {
  Vault,
  Lock,
  Menu,
  X,
  ArrowLeft,
  ShieldCheck,
  Plus,
} from "lucide-react";
import AssetList from "@/components/dashboard/AssetList";
import AddAssetModal from "@/components/dashboard/AddAssetModal";

export default function VaultDashboard() {
  const vaultKey = useSelector((state) => state.vault.vaultKey);
  const dispatch = useDispatch();
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // To trigger list refresh

  // Render page only if vaultKey is available
  useEffect(() => {
    if (!vaultKey) {
      router.replace("/dashboard");
    }
  }, [vaultKey, router]);

  const handleLockVault = () => {
    dispatch(clearVaultKey());
    router.replace("/dashboard");
  };

  const handleAssetAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-[#0A101F] via-[#0F172A] to-[#0A101F] text-white">
      {/* Header */}
      <header className="p-4 border-b border-blue-800/30 bg-[#0A101F]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
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
              <h1 className="text-xl sm:text-2xl font-bold">SecureVault</h1>
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

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors shadow-lg hover:shadow-green-500/20"
            >
              <Plus size={16} /> Add Asset
            </button>

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
        {/* Sidebar (Optional info) */}
        <div
          className={`${
            showSidebar ? "block" : "hidden"
          } lg:block w-full lg:w-64 bg-[#0F172A] p-5 rounded-2xl shadow-lg border border-gray-800 h-fit lg:sticky lg:top-24`}
        >
          <div className="p-4 bg-[#1E293B] rounded-xl border border-green-700/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-600/20 p-1.5 rounded-lg">
                <ShieldCheck size={18} className="text-green-400" />
              </div>
              <h3 className="font-medium">Security Status</h3>
            </div>
            <p className="text-xs text-gray-400">
              Vault is secured with AES-256 encryption. All data is end-to-end
              encrypted. Server never sees your secrets.
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
              Asset Types
            </h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>• Crypto Wallets</li>
              <li>• Bank Accounts</li>
              <li>• Secret Notes</li>
              <li>• Legal Docs</li>
              <li>• Recovery Phrases</li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <section className="flex-1">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">My Assets</h2>
            <p className="text-gray-400 text-sm">
              Manage your secure digital assets. Click "Reveal" to decrypt
              sensitive information.
            </p>
          </div>

          <AssetList
            key={refreshTrigger}
            vaultKey={vaultKey}
            onAddAsset={() => setIsAddModalOpen(true)}
            onEditAsset={(asset) => console.log("Edit asset:", asset)} // TODO: Implement Edit
          />
        </section>
      </div>

      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        vaultKey={vaultKey}
        onAssetAdded={handleAssetAdded}
      />

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
