"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  deriveMasterKey,
  decryptVaultKey,
  decryptTextData,
  decryptAssetData,
  generateHeirClaimProof,
  decryptRSA,
} from "../utils/vaultCrypto";
import { authFetch } from "@/utils/authFetch";

const HeirClaimVault = () => {
  const { heir } = useSelector((state) => state.heir);
  const [step, setStep] = useState(1); // 1: Initiate, 2: Decrypt, 3: Success
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [claimData, setClaimData] = useState(null); // { encryptedVaultKeyForHeir, challenge, challengeId }
  const [assets, setAssets] = useState([]);
  const [vaultKey, setVaultKey] = useState(null);

  // Phase 1: Initiate Claim
  const handleInitiate = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch("/api/heir/vault/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (data.success) {
        setClaimData(data);
        setStep(2);
      } else {
        setError(data.message || "Failed to initiate claim");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to initiate claim");
    } finally {
      setLoading(false);
    }
  };

  // Phase 2 & 3: Decrypt & Submit Proof
  const handleClaim = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!heir || !claimData) throw new Error("Missing data");

      // 1. Derive Heir Master Key
      // Salt is now returned in claimData from initiateClaim
      const salt = claimData.salt;
      if (!salt) throw new Error("Heir salt not found in claim data.");

      console.log("🔍 DEBUG - Client-side claim process:");
      console.log("  1. Salt (first 20 chars):", salt?.substring(0, 20));

      const heirMasterKey = deriveMasterKey(password, salt);
      console.log(
        "  2. Derived master key (first 20 chars):",
        heirMasterKey?.substring(0, 20)
      );

      // 2. Decrypt Heir Private Key
      // encryptedPrivateKey is now returned in claimData
      const encryptedPrivateKey = claimData.encryptedPrivateKey;
      if (!encryptedPrivateKey)
        throw new Error("Encrypted private key not found in claim data.");

      console.log(
        "  3. Encrypted private key (first 50 chars):",
        encryptedPrivateKey?.substring(0, 50)
      );

      // Decrypt RSA Private Key (AES Decrypt  - use decryptTextData for text strings)
      const rsaPrivateKeyBase64 = decryptTextData(
        encryptedPrivateKey,
        heirMasterKey
      );
      if (!rsaPrivateKeyBase64)
        throw new Error("Failed to decrypt private key. Wrong password?");

      console.log(
        "  4. Decrypted RSA private key (base64, first 100 chars):",
        rsaPrivateKeyBase64?.substring(0, 100)
      );
      console.log(
        "  5. Encrypted vault key for heir (first 100 chars):",
        claimData.encryptedVaultKeyForHeir?.substring(0, 100)
      );

      // 3. Decrypt Vault Key
      // encryptedVaultKeyForHeir is encrypted with RSA Public Key.
      // We need to decrypt it using RSA Private Key.
      let vaultKey = await decryptRSA(
        claimData.encryptedVaultKeyForHeir,
        rsaPrivateKeyBase64
      );

      console.log(
        "  6. Decrypted vault key (first 20 chars):",
        vaultKey?.substring(0, 20)
      );

      console.log("🔑 Decrypted Vault Key Inspection:");
      console.log("  - Original Key (Single Base64):", vaultKey);

      // CRITICAL FIX: The owner's vaultKey is double-base64 encoded due to
      // decryptVaultKey implementation. We must match that format.
      // The heir gets Single Base64 from RSA decryption.
      // We re-encode it to Double Base64 to match what encryptAssetData expects.
      vaultKey = btoa(vaultKey);

      console.log("  - Re-encoded Key (Double Base64):", vaultKey);
      console.log("  - Length:", vaultKey?.length);

      // 4. Generate Proof
      // `proof` = AES_Encrypt(challenge + "||" + heirId, vaultKey)

      // 5. Submit
      const proof = await generateHeirClaimProof(
        claimData.challenge,
        heir.id,
        vaultKey // We need the actual vaultKey string
      );

      setVaultKey(vaultKey); // Store for asset decryption

      const submitResponse = await authFetch("/api/heir/vault/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: claimData.challengeId,
          proof: proof,
        }),
      });

      const submitData = await submitResponse.json();
      if (submitData.success) {
        setStep(3);
        // Fetch assets
        fetchAssets();
      } else {
        throw new Error(submitData.message || "Failed to claim vault");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to claim vault");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await authFetch("/api/heir/vault/assets");
      const data = await response.json();
      if (data.success) {
        setAssets(data.assets);
      }
    } catch (err) {
      console.error("Failed to fetch assets", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Claim Inheritance</h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Ready to Claim</h2>
            <p className="text-gray-400 mb-6">
              The vault is now in an inheritable state. You can initiate the
              claim process. This will permanently lock the original owner out
              and transfer access to you.
            </p>
            <button
              onClick={handleInitiate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition"
            >
              {loading ? "Initiating..." : "Initiate Claim"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Decrypt Vault Key</h2>
            <p className="text-gray-400 mb-6">
              Enter your Master Password to decrypt your private key and claim
              the vault.
            </p>
            <form onSubmit={handleClaim}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Master Password"
                className="w-full bg-gray-700 border border-gray-600 rounded p-3 mb-4 text-white"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition"
              >
                {loading ? "Decrypting & Claiming..." : "Unlock & Claim"}
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-green-400">
              Vault Claimed Successfully!
            </h2>
            <p className="text-gray-400 mb-6">
              You now have access to the vault assets.
            </p>

            <div className="space-y-4">
              {assets.length === 0 ? (
                <p>Loading assets...</p>
              ) : (
                assets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} vaultKey={vaultKey} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AssetCard = ({ asset, vaultKey }) => {
  const [decryptedData, setDecryptedData] = useState(null);
  const [show, setShow] = useState(false);
  const [decrypting, setDecrypting] = useState(false);

  const handleDecrypt = async () => {
    if (show) {
      setShow(false);
      return;
    }

    if (decryptedData) {
      setShow(true);
      return;
    }

    setDecrypting(true);
    try {
      // Asset data structure depends on type.
      // BankAccount: encryptedData (string)
      // CryptoWallet: encryptedData (string)
      // etc.
      // But asset object here has sub-arrays: bankAccounts, cryptoWallets etc.
      // We should iterate over them.
      // For simplicity, let's just show the first item of each type or list them.

      // Actually, the asset object IS the DigitalAsset, which has relations.
      // We need to decrypt the sub-items.

      const decryptedItems = {};

      if (asset.bankAccounts?.length) {
        decryptedItems.bankAccounts = await Promise.all(
          asset.bankAccounts.map(async (acc) => {
            // encryptedData is a string in format "ciphertext:iv", not JSON
            const decrypted = await decryptAssetData(
              acc.encryptedData,
              vaultKey
            );
            return { ...acc, decrypted: JSON.parse(decrypted) };
          })
        );
      }

      if (asset.cryptoWallets?.length) {
        decryptedItems.cryptoWallets = await Promise.all(
          asset.cryptoWallets.map(async (wallet) => {
            const decrypted = await decryptAssetData(
              wallet.encryptedData,
              vaultKey
            );
            return { ...wallet, decrypted: JSON.parse(decrypted) };
          })
        );
      }

      // Add other types...

      setDecryptedData(decryptedItems);
      setShow(true);
    } catch (err) {
      console.error("Decryption failed", err);
      alert("Failed to decrypt asset");
    } finally {
      setDecrypting(false);
    }
  };

  return (
    <div className="bg-gray-700 p-4 rounded">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold">{asset.title}</h3>
          <p className="text-sm text-gray-400">{asset.type}</p>
        </div>
        <button
          onClick={handleDecrypt}
          disabled={decrypting}
          className="bg-blue-600 hover:bg-blue-500 text-xs px-3 py-1 rounded disabled:opacity-50"
        >
          {decrypting ? "Decrypting..." : show ? "Hide" : "Decrypt & View"}
        </button>
      </div>

      {show && decryptedData && (
        <div className="mt-4 space-y-2 text-sm bg-gray-800 p-3 rounded">
          {decryptedData.bankAccounts?.map((acc, i) => (
            <div key={i}>
              <p>
                <span className="text-gray-400">Account:</span>{" "}
                {acc.decrypted.accountNumber}
              </p>
              <p>
                <span className="text-gray-400">IFSC:</span>{" "}
                {acc.decrypted.ifsc}
              </p>
            </div>
          ))}
          {decryptedData.cryptoWallets?.map((wallet, i) => (
            <div key={i}>
              <p>
                <span className="text-gray-400">Address:</span>{" "}
                {wallet.publicAddress}
              </p>
              <p>
                <span className="text-gray-400">Private Key:</span>{" "}
                {wallet.decrypted.privateKey}
              </p>
              <p>
                <span className="text-gray-400">Seed:</span>{" "}
                {wallet.decrypted.seedPhrase}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeirClaimVault;
