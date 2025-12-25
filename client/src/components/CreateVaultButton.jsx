"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  generateSalt,
  generateVaultKey,
  generateRecoveryKey,
  deriveMasterKey,
  encryptVaultKey,
} from "@/utils/vaultCrypto";
import { encryptVaultKeyWithHeirPublicKey } from "@/utils/heirCrypto";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "@/store/userSlice";
import { authFetch } from "@/utils/authFetch";

const passwordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function CreateVaultButton({ userId }) {
  const [open, setOpen] = useState(false);
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  const [finalConfirmOpen, setFinalConfirmOpen] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [heirs, setHeirs] = useState([]);

  useEffect(() => {
    if (open) {
      const fetchHeirs = async () => {
        try {
          const res = await authFetch("/api/user/heirs");
          const data = await res.json();
          if (data.success) {
            setHeirs(data.heirs.filter((h) => h.isVerified && h.publicKey));
          }
        } catch (error) {
          console.error("Failed to fetch heirs", error);
        }
      };
      fetchHeirs();
    }
  }, [open]);

  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();

  const handleCreateVault = async () => {
    const validation = passwordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      const fieldErrors = {};
      validation.error.errors.forEach((e) => {
        fieldErrors[e.path[0]] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsCreating(true);

    try {
      const vaultKey = generateVaultKey();
      const salt = generateSalt();
      const recoveryKeyGen = generateRecoveryKey();
      const masterKey = deriveMasterKey(password, salt);

      const encryptedVaultKey = encryptVaultKey(vaultKey, masterKey);
      const encryptedRecoveryKey = encryptVaultKey(vaultKey, recoveryKeyGen);

      // Encrypt for Heirs
      let encryptedVaultKeyByHeir = null;
      if (heirs.length > 0) {
        const heirKeys = {};
        for (const heir of heirs) {
          try {
            const encryptedForHeir = await encryptVaultKeyWithHeirPublicKey(
              vaultKey,
              heir.publicKey
            );
            heirKeys[heir.id] = encryptedForHeir;
          } catch (err) {
            console.error(`Failed to encrypt for heir ${heir.email}`, err);
          }
        }
        encryptedVaultKeyByHeir = JSON.stringify(heirKeys);
      }

      const response = await authFetch("/api/dashboard/vault/create-vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salt,
          encryptedVaultKey,
          encryptedRecoveryKey,
          encryptedVaultKeyByHeir,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        const text = await response.text();
        console.error("⚠️ Non-JSON response:", text);
        alert("❌ Server returned an invalid response");
        return;
      }

      if (response.ok) {
        setRecoveryKey(recoveryKeyGen);
        setOpen(false);
        setRecoveryDialogOpen(true);
        setPassword("");
        setConfirmPassword("");
        // dispatch(updateUser({ vaultCreated: true }));
      } else {
        console.error("❌ Server error:", data);
        alert(data?.message || "❌ Failed to create vault.");
      }
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    dispatch(updateUser({ vaultCreated: true }));
    setFinalConfirmOpen(false);
  };

  return (
    <>
      {/* Create Vault Button */}
      <div className="mt-6 flex justify-center">
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="px-8 py-4 bg-white text-blue-700 text-lg font-semibold rounded-xl shadow-lg hover:bg-gray-100 hover:text-blue-500 transition-all duration-200">
              Create Your Secure Vault
            </button>
          </Dialog.Trigger>

          {user?.twoFactorEnabled === false ? (
            // If 2FA is NOT enabled
            <Dialog.Portal>
              <Dialog.Overlay className="bg-black/60 fixed inset-0 z-40 backdrop-blur-sm" />
              <Dialog.Content className="z-50 fixed top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-white/90 focus:outline-none">
                <Dialog.Title className="text-2xl font-bold mb-2 text-center text-zinc-900 dark:text-white">
                  Two-Factor Authentication Required
                </Dialog.Title>
                <Dialog.Description className="text-sm mb-5 text-center text-zinc-600 dark:text-zinc-300">
                  Please enable two-factor authentication in your account
                  settings before creating a vault.
                </Dialog.Description>
                <div className="flex justify-center">
                  <Dialog.Close asChild>
                    <button className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
                      Close
                    </button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          ) : (
            // If 2FA is enabled
            <Dialog.Portal>
              <Dialog.Overlay className="bg-black/60 fixed inset-0 z-40 backdrop-blur-sm" />
              <Dialog.Content className="z-50 fixed top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-700 focus:outline-none">
                <Dialog.Title className="text-2xl font-bold mb-2 text-center text-zinc-900 dark:text-white">
                  Create Your Vault
                </Dialog.Title>
                <Dialog.Description className="text-sm mb-5 text-center text-zinc-600 dark:text-zinc-300">
                  Enter and confirm your master password.
                </Dialog.Description>

                <div className="space-y-4">
                  <div>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring focus:ring-blue-500"
                      placeholder="Master Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring focus:ring-blue-500"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <Dialog.Close asChild>
                    <button className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    disabled={isCreating}
                    onClick={handleCreateVault}
                    className="px-4 py-2 bg-gradient-to-r from-teal-700 to-blue-600 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
                  >
                    {isCreating ? "Creating..." : "Create Vault"}
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </Dialog.Root>
      </div>

      {/* Recovery Key Dialog */}
      <Dialog.Root
        open={recoveryDialogOpen}
        onOpenChange={(open) => {
          setRecoveryDialogOpen(open);
          if (!open) setFinalConfirmOpen(true);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="bg-black/60 fixed inset-0 z-50 backdrop-blur-sm" />
          <Dialog.Content className="z-50 fixed top-1/2 left-1/2 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-700 focus:outline-none">
            <Dialog.Title className="text-xl font-bold text-center mb-4 text-zinc-900 dark:text-white">
              🔐 Save Your Recovery Key
            </Dialog.Title>
            <p className="text-sm text-center text-zinc-700 dark:text-zinc-300 mb-4">
              This is your only way to recover your vault if you forget the
              master password.
            </p>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-md text-sm break-all font-mono text-zinc-900 dark:text-white mb-4">
              {recoveryKey}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                {copied ? "✅ Copied!" : "📋 Copy Key"}
              </button>

              <Dialog.Close asChild>
                <button className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600 transition">
                  Close
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Final Confirmation Dialog */}
      <Dialog.Root open={finalConfirmOpen} onOpenChange={setFinalConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-black/60 fixed inset-0 z-50 backdrop-blur-sm" />
          <Dialog.Content className="z-50 fixed top-1/2 left-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-700 focus:outline-none text-center">
            <Dialog.Title className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
              ✅ Vault Created Successfully!
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                onClick={handleClose}
              >
                Close
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
