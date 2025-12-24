"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { 
  deriveMasterKey, 
  generateSalt 
} from "@/utils/vaultCrypto";
import { 
  generateRSAKeyPair, 
  encryptHeirPrivateKey 
} from "@/utils/heirCrypto";
import { authFetch } from "@/utils/authFetch";

export default function HeirKeySetup({ heir, onSetupComplete }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle"); // idle, processing, success, error
  const [steps, setSteps] = useState([
    { id: 1, label: "Generating Salt", status: "pending" },
    { id: 2, label: "Deriving Master Key", status: "pending" },
    { id: 3, label: "Generating RSA Key Pair", status: "pending" },
    { id: 4, label: "Encrypting Private Key", status: "pending" },
    { id: 5, label: "Securing Keys on Server", status: "pending" },
  ]);

  const updateStep = (id, status) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, status } : step))
    );
  };

  const handleSetup = async () => {
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setStatus("processing");

    try {
      // Step 1: Generate Salt
      updateStep(1, "active");
      await new Promise(r => setTimeout(r, 500)); // Visual delay
      const salt = generateSalt();
      updateStep(1, "completed");

      // Step 2: Derive Master Key
      updateStep(2, "active");
      await new Promise(r => setTimeout(r, 500));
      const masterKey = deriveMasterKey(password, salt);
      updateStep(2, "completed");

      // Step 3: Generate RSA Key Pair
      updateStep(3, "active");
      await new Promise(r => setTimeout(r, 500));
      const { publicKey, privateKey } = await generateRSAKeyPair();
      updateStep(3, "completed");

      // Step 4: Encrypt Private Key
      updateStep(4, "active");
      await new Promise(r => setTimeout(r, 500));
      // encryptHeirPrivateKey returns "iv:ciphertext"
      const encryptedPrivateKey = encryptHeirPrivateKey(privateKey, masterKey);
      updateStep(4, "completed");

      // Step 5: Send to Server
      updateStep(5, "active");
      const res = await authFetch("/api/heir/auth/verify-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey,
          encryptedPrivateKey,
          salt,
        }),
      });

      const data = await res.json();

      if (data.success) {
        updateStep(5, "completed");
        setStatus("success");
        setTimeout(() => {
          setOpen(false);
          if (onSetupComplete) onSetupComplete();
        }, 2000);
      } else {
        throw new Error(data.message || "Failed to setup keys");
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatus("error");
    }
  };

  if (heir?.isVerified) {
    return (
      <div className="bg-slate-900/50 p-6 rounded-2xl shadow-lg border border-slate-800 backdrop-blur-sm h-full">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Key Setup Complete</h3>
            <p className="text-sm text-slate-400">Your secure keys are generated and stored.</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">Last updated: Just now</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-900/50 p-6 rounded-2xl shadow-lg border border-slate-800 backdrop-blur-sm h-full flex flex-col justify-between">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Key Setup Required</h3>
            <p className="text-sm text-slate-400">Set up your master password to secure your access.</p>
          </div>
        </div>
        <button 
          onClick={() => setOpen(true)}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Setup Now
        </button>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 focus:outline-none">
            <Dialog.Title className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
              Setup Your Master Key
            </Dialog.Title>
            <Dialog.Description className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              This password will encrypt your private key. You MUST remember it to access the vault later.
            </Dialog.Description>

            {status === "idle" || status === "error" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Master Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter a strong password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Confirm Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Confirm your password"
                  />
                </div>
                
                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-end gap-3 mt-6">
                  <Dialog.Close asChild>
                    <button className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button 
                    onClick={handleSetup}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Start Setup
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                      step.status === "completed" ? "bg-green-500 border-green-500 text-white" :
                      step.status === "active" ? "border-blue-500 text-blue-500 animate-pulse" :
                      "border-zinc-300 dark:border-zinc-700 text-zinc-400"
                    }`}>
                      {step.status === "completed" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      ) : step.id}
                    </div>
                    <span className={`text-sm ${
                      step.status === "active" ? "text-blue-500 font-medium" :
                      step.status === "completed" ? "text-green-500" :
                      "text-zinc-500"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
                
                {status === "success" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 text-center text-green-500 font-medium"
                  >
                    Setup Complete! Redirecting...
                  </motion.div>
                )}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
