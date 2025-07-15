// components/AddCryptoWalletForm.jsx
"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, Key, Lock, Wallet, Network } from "lucide-react";
import { useState, useEffect } from "react";

const initialFormState = {
  title: "",
  publicAddress: "",
  network: "Ethereum",
  privateKey: "",
  seedPhrase: "",
};

export default function AddCryptoWalletForm({ open, onOpenChange, onSubmit }) {
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) setForm(initialFormState);
  }, [open]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formattedData = {
        title: form.title,
        publicAddress: form.publicAddress,
        network: form.network,
        secretInfo: {
          privateKey: form.privateKey,
          seedPhrase: form.seedPhrase,
        },
      };

      await onSubmit(formattedData);
      onOpenChange(false);
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const networkOptions = [
    "Ethereum",
    "Bitcoin",
    "Polygon",
    "Solana",
    "Avalanche",
    "Binance Smart Chain",
    "Other",
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />

        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 w-[110vw] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-700 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-5 top-0 bg-white dark:bg-zinc-900 pb-4 pt-1 z-10">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                  Add Crypto Wallet
                </Dialog.Title>
                <Dialog.Description className="text-xs text-gray-500 dark:text-gray-400">
                  Securely store your wallet credentials
                </Dialog.Description>
              </div>
            </div>

            <Dialog.Close asChild>
              <button className="text-gray-500 hover:text-gray-800 dark:hover:text-white bg-gray-100 dark:bg-zinc-700 rounded-full p-1.5">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pb-1">
            <div className="space-y-3">
              <div className="relative">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Wallet Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    placeholder="e.g., Main Ethereum"
                    value={form.title}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="relative">
                <label
                  htmlFor="network"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Network
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Network className="h-4 w-4" />
                  </div>
                  <select
                    id="network"
                    name="network"
                    value={form.network}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-8 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    {networkOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <label
                htmlFor="publicAddress"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Public Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="publicAddress"
                  name="publicAddress"
                  placeholder="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
                  value={form.publicAddress}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg">
                  <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                  Sensitive Credentials
                </h3>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <label
                    htmlFor="privateKey"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Private Key
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Key className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      id="privateKey"
                      name="privateKey"
                      placeholder="Enter your private key"
                      value={form.privateKey}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-white/50 dark:bg-zinc-800/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label
                    htmlFor="seedPhrase"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Seed Phrase
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <textarea
                      id="seedPhrase"
                      name="seedPhrase"
                      placeholder="Enter your 12 or 24 word seed phrase"
                      value={form.seedPhrase}
                      onChange={handleChange}
                      rows={isMobile ? 2 : 3}
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-white/50 dark:bg-zinc-800/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
              <div className="flex items-center bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-xs">
                <svg
                  className="h-3 w-3 text-blue-600 dark:text-blue-400 mr-1.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-600 dark:text-gray-400">
                  AES-256 encrypted
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium rounded-lg transition-all shadow hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Securing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Save Wallet
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
