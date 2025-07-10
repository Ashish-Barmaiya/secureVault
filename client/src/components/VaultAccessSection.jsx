// components/VaultAccessSection.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setVaultKey } from "@/store/vaultSlice";
import VaultUnlockDialog from "./VaultUnlockDialog";
import { Vault, Lock, Unlock } from "lucide-react";
import { deriveMasterKey, decryptVaultKey } from "@/utils/vaultCrypto";

export default function VaultAccessSection({ userId }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const vaultKey = useSelector((state) => state.vault.vaultKey);
  const dispatch = useDispatch();

  const router = useRouter();

  const handleOpenVault = () => {
    if (vaultKey) {
      router.push("/dashboard/vault");
    } else {
      setError(null);
      setIsDialogOpen(true);
    }
  };

  const handleUnlock = async (password) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/dashboard/vault/unlock-vault");

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Unlock failed");
      }

      const data = await res.json();
      const { salt, encryptedVaultKey } = data.vault;

      if (!salt || !encryptedVaultKey) {
        throw new Error("Incomplete vault data");
      }

      const masterKey = deriveMasterKey(password, salt);
      const decryptedKey = decryptVaultKey(encryptedVaultKey, masterKey);

      if (!decryptedKey || decryptedKey.length < 10) {
        throw new Error("Incorrect password or corrupted vault key");
      }

      dispatch(setVaultKey(decryptedKey));
      setIsDialogOpen(false);
      router.push("/dashboard/vault"); // Redirect to vault page after unlocking
    } catch (err) {
      console.error("Vault unlock error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="relative px-4 py-16 sm:px-6 sm:py-12 md:py-16 rounded-xl shadow-lg overflow-hidden bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: "url('/blob-scene-haikei.svg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/40 to-blue-600/40 z-0" />

        <div className="absolute inset-0 z-0 pointer-events-none">
          <Vault className="text-white opacity-20 w-6 h-6 sm:w-8 sm:h-8 absolute top-4 left-4 rotate-12" />
          <Vault className="text-white opacity-20 w-5 h-5 sm:w-7 sm:h-7 absolute top-8 right-6 -rotate-6" />
          <Vault className="text-white opacity-20 w-7 h-7 sm:w-10 sm:h-10 absolute bottom-6 left-6 rotate-45" />
          <Vault className="text-white opacity-20 w-6 h-6 sm:w-8 sm:h-8 absolute bottom-10 right-10 -rotate-12" />
          <Vault className="text-white opacity-20 w-6 h-6 sm:w-8 sm:h-10 absolute top-8 left-1/2  rotate-6" />
          <Vault className="text-white opacity-20 w-5 h-5 sm:w-6 sm:h-6 absolute top-1/4 right-[15%] -rotate-3" />
          <Vault className="text-white opacity-20 w-5 h-5 sm:w-6 sm:h-6 absolute bottom-1/3 left-[20%] rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-2">
          <button
            onClick={handleOpenVault}
            className="flex items-center gap-2 px-6 py-3 text-base sm:text-lg font-semibold bg-white text-blue-700 rounded-2xl shadow-md transition-all duration-300 hover:bg-zinc-100"
          >
            <Vault size={24} className="text-blue-700" />
            Open Vault
          </button>

          <span
            className={`mt-0.5 inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${
              vaultKey ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {vaultKey ? (
              <>
                <Unlock size={14} className="text-white" />
                Unlocked
              </>
            ) : (
              <>
                <Lock size={14} className="text-white" />
                Locked
              </>
            )}
          </span>
        </div>
      </div>

      <VaultUnlockDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onUnlock={handleUnlock}
        loading={loading}
        error={error}
      />

      {vaultKey && (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl shadow">
          <p className="text-sm">Vault is unlocked 🔓</p>
        </div>
      )}
    </>
  );
}
