"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import {
  deriveMasterKey,
  decryptVaultKey,
  decryptRSA,
  decryptAssetData,
  decryptTextData,
} from "@/utils/vaultCrypto";
import { Lock, Unlock, Eye, Copy, AlertTriangle } from "lucide-react";

export default function InheritedVaultView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vaultData, setVaultData] = useState(null); // { assets, keys }
  const [password, setPassword] = useState("");
  const [vaultKey, setVaultKey] = useState(null); // Session-only key
  const [decryptedAssets, setDecryptedAssets] = useState({});
  const [unlocking, setUnlocking] = useState(false);

  // Fetch encrypted data on mount
  useEffect(() => {
    const fetchVaultData = async () => {
      try {
        const res = await authFetch("/api/heir/vault/assets");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to load vault data");
        }
        const data = await res.json();
        setVaultData(data);
      } catch (err) {
        console.error("Error fetching inherited vault:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVaultData();

    // Cleanup: Clear key on unmount
    return () => {
      setVaultKey(null);
      setDecryptedAssets({});
    };
  }, []);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlocking(true);
    setError(null);

    try {
      const { salt, encryptedPrivateKey, encryptedVaultKeyForHeir } =
        vaultData.keys;

      if (!salt || !encryptedPrivateKey || !encryptedVaultKeyForHeir) {
        throw new Error("Missing cryptographic data. Cannot unlock.");
      }

      // 1. Derive Heir Master Key
      const heirMasterKey = deriveMasterKey(password, salt);

      // 2. Decrypt RSA Private Key
      // Use decryptTextData to avoid double-base64 encoding issues for the private key itself
      const rsaPrivateKeyBase64 = decryptTextData(
        encryptedPrivateKey,
        heirMasterKey
      );

      if (!rsaPrivateKeyBase64) {
        throw new Error("Incorrect password.");
      }

      // 3. Decrypt Vault Key
      let decryptedVaultKey = await decryptRSA(
        encryptedVaultKeyForHeir,
        rsaPrivateKeyBase64
      );

      // CRITICAL: Re-encode to Double Base64 to match Owner's format
      decryptedVaultKey = btoa(decryptedVaultKey);

      setVaultKey(decryptedVaultKey);
      setPassword(""); // Clear password from state
    } catch (err) {
      console.error("Unlock failed:", err);
      setError(err.message || "Failed to unlock vault. Check your password.");
    } finally {
      setUnlocking(false);
    }
  };

  const handleLock = () => {
    setVaultKey(null);
    setDecryptedAssets({});
    setPassword("");
  };

  const handleDecryptAsset = async (assetId, encryptedData) => {
    if (!vaultKey) return;

    try {
      const decrypted = await decryptAssetData(encryptedData, vaultKey);
      setDecryptedAssets((prev) => ({
        ...prev,
        [assetId]: JSON.parse(decrypted),
      }));
    } catch (err) {
      console.error("Asset decryption failed:", err);
      alert("Failed to decrypt asset.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !vaultData) {
    return (
      <div className="p-8 text-center text-red-400">
        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  // LOCKED STATE
  if (!vaultKey) {
    return (
      <div className="max-w-md mx-auto mt-10 pt-32 pb-12 bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
          <div className="bg-blue-900/30 p-4 rounded-full inline-block mb-4">
            <Lock className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Inherited Vault</h2>
          <p className="text-gray-400 mt-2">
            Enter your heir master password to unlock and view assets.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Master Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter password..."
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={unlocking}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {unlocking ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Processing...
              </div>
            ) : (
              "Unlock Vault"
            )}
          </button>
        </form>
      </div>
    );
  }

  // UNLOCKED STATE
  return (
    <div className="max-w-6xl mx-auto mt-8 pt-32 pb-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Unlock className="text-green-400" />
            Inherited Vault
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Read-only access. Session active.
          </p>
        </div>
        <button
          onClick={handleLock}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Lock size={16} />
          Lock Vault
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vaultData.assets.map((asset) => (
          <div key={asset.id}>
            {/* Crypto Wallets */}
            {asset.cryptoWallets?.map((wallet) => (
              <AssetCard
                key={wallet.id}
                title={wallet.label || "Crypto Wallet"}
                type="Crypto Wallet"
                network={wallet.network}
                publicInfo={wallet.publicAddress}
                encryptedData={wallet.encryptedData}
                decryptedData={decryptedAssets[wallet.id]}
                onDecrypt={() =>
                  handleDecryptAsset(wallet.id, wallet.encryptedData)
                }
              />
            ))}
            {/* Bank Accounts */}
            {asset.bankAccounts?.map((acc) => (
              <AssetCard
                key={acc.id}
                title={acc.bankName}
                type="Bank Account"
                publicInfo={`Ends in ${acc.accountNumber.slice(-4)}`}
                encryptedData={acc.encryptedData}
                decryptedData={decryptedAssets[acc.id]}
                onDecrypt={() => handleDecryptAsset(acc.id, acc.encryptedData)}
              />
            ))}
            {/* Add other asset types as needed */}
          </div>
        ))}
      </div>

      {vaultData.assets.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No assets found in this vault.
        </div>
      )}
    </div>
  );
}

function AssetCard({
  title,
  type,
  network,
  publicInfo,
  encryptedData,
  decryptedData,
  onDecrypt,
}) {
  const [isDecrypting, setIsDecrypting] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleDecryptClick = async () => {
    setIsDecrypting(true);
    try {
      await onDecrypt();
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-white text-lg">{title}</h3>
          <span className="text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded mt-1 inline-block">
            {type} {network && `• ${network}`}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Public Info</p>
        <div className="bg-gray-900 p-2 rounded text-sm font-mono text-gray-300 truncate">
          {publicInfo}
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        {decryptedData ? (
          <div className="space-y-3 animate-fadeIn">
            {Object.entries(decryptedData).map(([key, value]) => (
              <div key={key}>
                <p className="text-xs text-gray-500 mb-1 capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </p>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-900 p-2 rounded text-sm font-mono text-green-400 break-all flex-1">
                    {value}
                  </div>
                  <button
                    onClick={() => copyToClipboard(value)}
                    className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <button
            onClick={handleDecryptClick}
            disabled={isDecrypting}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDecrypting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Decrypting...
              </>
            ) : (
              <>
                <Eye size={16} />
                Decrypt & View
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
