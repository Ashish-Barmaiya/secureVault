// components/VaultAccessSection.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setVaultKey } from "@/store/vaultSlice";
import { deriveMasterKey, decryptVaultKey } from "@/utils/vaultCrypto";
import { authFetch } from "@/utils/authFetch";
import VaultAccessPanel from "./dashboard/VaultAccessPanel";
import { Unlock } from "lucide-react";

export default function VaultAccessSection({ userId }) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState(null);

  const user = useSelector((state) => state.user.user);
  const vaultKey = useSelector((state) => state.vault.vaultKey);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleUnlock = async (password) => {
    try {
      setLoading(true);
      setError(null);
      setStatusMessage("Starting unlock process...");

      // ============================================================
      // STEP 1: Fetch Challenge (VUA)
      // ============================================================
      setStatusMessage("Fetching cryptographic challenge...");
      let challengeId, challenge, unlockCounter;

      try {
        const challengeRes = await authFetch("/api/dashboard/vault/challenge", {
          method: "POST",
        });

        if (!challengeRes.ok) {
          console.warn("⚠️ Challenge fetch failed (VUA will be skipped)");
        } else {
          const challengeData = await challengeRes.json();
          challengeId = challengeData.challengeId;
          challenge = challengeData.challenge;
          unlockCounter = challengeData.unlockCounter;
        }
      } catch (err) {
        console.warn("⚠️ Challenge fetch error (VUA will be skipped):", err);
      }

      // ============================================================
      // STEP 2: Fetch Encrypted Vault Data from Server
      // ============================================================
      setStatusMessage("Retrieving encrypted vault data...");
      const res = await authFetch("/api/dashboard/vault/unlock-vault");

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 403) {
          throw new Error(
            "Access Denied: This vault has been transferred to your heir and is no longer accessible."
          );
        }
        throw new Error(errorData.error || "Unlock failed");
      }

      const data = await res.json();
      const { salt, encryptedVaultKey } = data.vault;

      if (!salt || !encryptedVaultKey) {
        throw new Error("Incomplete vault data");
      }

      // ============================================================
      // STEP 3: Client-Side Decryption (CRITICAL SECURITY BOUNDARY)
      // ============================================================
      setStatusMessage("Deriving master key...");
      await new Promise((resolve) => setTimeout(resolve, 300)); // Brief pause for UX
      const masterKey = deriveMasterKey(password, salt);

      setStatusMessage("Decrypting vault key...");
      await new Promise((resolve) => setTimeout(resolve, 300));
      const decryptedKey = decryptVaultKey(encryptedVaultKey, masterKey);

      if (!decryptedKey || decryptedKey.length < 10) {
        // CLIENT-SIDE DECRYPTION FAILED
        setStatusMessage("Reporting failed unlock attempt...");

        // Report failure for rate limiting
        try {
          await authFetch("/api/dashboard/vault/unlock-failed", {
            method: "POST",
          });
        } catch (err) {
          console.warn("Failed to report unlock failure:", err);
        }

        throw new Error("Incorrect password or corrupted vault key");
      }

      // ============================================================
      // STEP 4: VAULT UNLOCKED! Store key and open vault immediately
      // ============================================================
      setStatusMessage("Vault unlocked! Opening...");
      console.log("✅ Vault decrypted successfully");
      dispatch(setVaultKey(decryptedKey));

      // ============================================================
      // STEP 5: Background VUA Submission (BEST-EFFORT, NON-BLOCKING)
      // ============================================================
      if (challengeId && challenge && unlockCounter !== undefined) {
        // Dynamic import to avoid bundling issues
        import("@/utils/vaultCrypto").then(
          async ({ generateUnlockAttestation }) => {
            try {
              const attestation = await generateUnlockAttestation(
                challenge,
                unlockCounter,
                decryptedKey
              );

              await authFetch("/api/dashboard/vault/unlock-attestation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  challengeId,
                  unlockCounter,
                  attestation,
                }),
              });
              console.log("✅ Liveness proof submitted successfully");
            } catch (err) {
              console.warn("⚠️ VUA error:", err);
            }
          }
        );
      }

      // Navigate to vault
      router.push("/dashboard/vault");
    } catch (err) {
      console.error("❌ Vault unlock error:", err);
      setError(err.message);
      setStatusMessage(""); // Clear status on error
      alert(err.message); // Simple alert for now, or pass error to Panel
    } finally {
      setLoading(false);
    }
  };

  // If vault is already unlocked, show a simple message or nothing
  if (vaultKey) {
    return (
      <div className="mt-8 border-t border-slate-800 pt-8">
        <div className="max-w-2xl mx-auto bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-2xl text-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-full">
              <Unlock className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-300">
              Vault Unlocked
            </h3>
            <p className="text-emerald-200/70 text-sm mb-4">
              Your vault is currently decrypted and accessible.
            </p>
            <button
              onClick={() => router.push("/dashboard/vault")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Enter Vault
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user hasn't created a vault yet, we might want to hide this or show "Create Vault"
  // But the dashboard redesign assumes an active user.
  // If no vault, maybe show nothing or a different state.
  if (user?.vaultCreated === false) {
    return null; // Or a "Create Vault" placeholder if needed, but the prompt implies redesigning the control panel for existing users.
  }

  return (
    <VaultAccessPanel onUnlock={handleUnlock} statusMessage={statusMessage} />
  );
}
