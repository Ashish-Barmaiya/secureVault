// components/AddAssetButton.jsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import AddCryptoWalletForm from "./AddCryptoWalletForm";

export default function AddAssetButton({ onSubmitCryptoWallet }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cryptoDialogOpen, setCryptoDialogOpen] = useState(false);

  const assetTypes = [
    { id: "crypto", label: "Crypto Wallet" },
    { id: "bank", label: "Bank Account" },
    { id: "social", label: "Social Media" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
      >
        <Plus size={16} /> Add New Asset
      </button>

      {dropdownOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border dark:border-zinc-700 z-10">
          <ul>
            {assetTypes.map((asset) => (
              <li key={asset.id}>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  onClick={() => {
                    if (asset.id === "crypto") {
                      setCryptoDialogOpen(true);
                    }
                    setDropdownOpen(false);
                  }}
                >
                  {asset.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AddCryptoWalletForm
        open={cryptoDialogOpen}
        onOpenChange={setCryptoDialogOpen}
        onSubmit={onSubmitCryptoWallet}
      />
    </div>
  );
}
