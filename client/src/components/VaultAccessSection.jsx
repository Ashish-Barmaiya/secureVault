// components/VaultAccessSection.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setVaultKey } from "@/store/vaultSlice";
import EnhancedVaultUnlockDialog from "./EnhancedVaultUnlockDialog";
import { Vault, Lock, Unlock } from "lucide-react";
import { deriveMasterKey, decryptVaultKey } from "@/utils/vaultCrypto";
import CreateVaultButton from "@/components/CreateVaultButton";
import { authFetch } from "@/utils/authFetch";

export default function VaultAccessSection({ userId }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [failureCount, setFailureCount] = useState(0);
  const [vuaStatus, setVuaStatus] = useState(null); // "success", "failed", null

  const user = useSelector((state) => state.user.user);
  const vaultKey = useSelector((state) => state.vault.vaultKey);
  const dispatch = useDispatch();

  const router = useRouter();

  const handleOpenVault = () => {
    if (vaultKey) {
      router.push("/dashboard/vault");
    } else {
      setError(null);
      setVuaStatus(null);
      setIsDialogOpen(true);
    }
  };

  const handleUnlock = async (password, setCurrentStep) => {
    try {
      setLoading(true);
      setError(null);
      setVuaStatus(null);

      // ============================================================
      // STEP 1: Fetch Challenge (VUA)
      // ============================================================
      setCurrentStep("Fetching cryptographic challenge...");
      let challengeId, challenge, unlockCounter;

      try {
        const challengeRes = await authFetch("/api/dashboard/vault/challenge", {
          method: "POST",
        });

        if (!challengeRes.ok) {
          console.warn(
            "⚠️ Challenge fetch failed (VUA will be skipped):",
            await challengeRes.text()
          );
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
      setCurrentStep("Retrieving encrypted vault data...");
      const res = await authFetch("/api/dashboard/vault/unlock-vault");

      if (!res.ok) {
        const errorData = await res.json();
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
      setCurrentStep("Deriving master key from password...");
      await new Promise((resolve) => setTimeout(resolve, 300)); // Brief pause for UX
      const masterKey = deriveMasterKey(password, salt);

      setCurrentStep("Decrypting vault key...");
      await new Promise((resolve) => setTimeout(resolve, 300));
      const decryptedKey = decryptVaultKey(encryptedVaultKey, masterKey);

      if (!decryptedKey || decryptedKey.length < 10) {
        // CLIENT-SIDE DECRYPTION FAILED
        setCurrentStep("Reporting failed unlock attempt...");

        // Report failure for rate limiting (does NOT update liveness)
        try {
          const failureRes = await authFetch(
            "/api/dashboard/vault/unlock-failed",
            {
              method: "POST",
            }
          );

          if (failureRes.ok) {
            const failureData = await failureRes.json();
            setFailureCount(failureData.failureCount || 0);
          }
        } catch (err) {
          console.warn("Failed to report unlock failure:", err);
        }

        throw new Error("Incorrect password or corrupted vault key");
      }

      // ============================================================
      // STEP 4: VAULT UNLOCKED! Store key and open vault immediately
      // ============================================================
      setCurrentStep("Vault unlocked! Opening...");
      console.log("✅ Vault decrypted successfully");
      dispatch(setVaultKey(decryptedKey));

      // Reset failure count on successful unlock
      setFailureCount(0);

      setIsDialogOpen(false);
      router.push("/dashboard/vault");

      // ============================================================
      // STEP 5: Background VUA Submission (BEST-EFFORT, NON-BLOCKING)
      // ============================================================
      if (challengeId && challenge && unlockCounter !== undefined) {
        setCurrentStep("Submitting liveness proof in background...");

        // Dynamic import to avoid bundling issues
        import("@/utils/vaultCrypto").then(
          async ({ generateUnlockAttestation }) => {
            try {
              const attestation = await generateUnlockAttestation(
                challenge,
                unlockCounter,
                decryptedKey
              );

              const attestationRes = await authFetch(
                "/api/dashboard/vault/unlock-attestation",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    challengeId,
                    unlockCounter,
                    attestation,
                  }),
                }
              );

              if (attestationRes.ok) {
                console.log("✅ Liveness proof submitted successfully");
                setVuaStatus("success");
              } else {
                const errorData = await attestationRes.json();
                console.warn("⚠️ VUA failed:", errorData.message);
                setVuaStatus("failed");
              }
            } catch (err) {
              console.warn("⚠️ VUA error:", err);
              setVuaStatus("failed");
            }
          }
        );
      } else {
        console.warn("⚠️ No challenge available - VUA skipped");
        setVuaStatus("failed");
      }
    } catch (err) {
      console.error("❌ Vault unlock error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setCurrentStep("");
    }
  };

  return (
    <>
      <div
        className="relative px-4 py-16 sm:px-6 sm:py-12 md:py-16 rounded-2xl shadow-lg overflow-hidden bg-center bg-cover bg-no-repeat border border-slate-700/50"
        style={{ backgroundImage: "url('/blob-scene-haikei.svg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 to-blue-900/80 z-0 backdrop-blur-sm" />

        <div className="absolute inset-0 z-0 pointer-events-none">
          <Vault className="text-white opacity-10 w-6 h-6 sm:w-8 sm:h-8 absolute top-4 left-4 rotate-12" />
          <Vault className="text-white opacity-10 w-5 h-5 sm:w-7 sm:h-7 absolute top-8 right-6 -rotate-6" />
          <Vault className="text-white opacity-10 w-7 h-7 sm:w-10 sm:h-10 absolute bottom-6 left-6 rotate-45" />
          <Vault className="text-white opacity-10 w-6 h-6 sm:w-8 sm:h-8 absolute bottom-10 right-10 -rotate-12" />
          <Vault className="text-white opacity-10 w-6 h-6 sm:w-8 sm:h-10 absolute top-8 left-1/2  rotate-6" />
          <Vault className="text-white opacity-10 w-5 h-5 sm:w-6 sm:h-6 absolute top-1/4 right-[15%] -rotate-3" />
          <Vault className="text-white opacity-10 w-5 h-5 sm:w-6 sm:h-6 absolute bottom-1/3 left-[20%] rotate-12" />
        </div>
        <div className="relative z-20">
          {user?.vaultCreated === false ? (
            <div>
              <CreateVaultButton />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleOpenVault}
                className="flex items-center gap-3 px-8 py-4 text-base sm:text-lg font-bold bg-white text-blue-900 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300 hover:bg-blue-50 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              >
                <Vault size={24} className="text-blue-600" />
                Open Vault
              </button>

              <span
                className={`mt-2 inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full border ${
                  vaultKey
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-red-500/20 text-red-300 border-red-500/30"
                }`}
              >
                {vaultKey ? (
                  <>
                    <Unlock size={14} />
                    Unlocked
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    Locked
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      <EnhancedVaultUnlockDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onUnlock={handleUnlock}
        loading={loading}
        error={error}
        failureCount={failureCount}
        vuaStatus={vuaStatus}
      />

      {vaultKey && (
        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl shadow backdrop-blur-sm">
          <p className="text-sm font-medium flex items-center gap-2">
            <Unlock size={16} />
            Vault is unlocked and ready for access
          </p>
        </div>
      )}
    </>
  );
}
