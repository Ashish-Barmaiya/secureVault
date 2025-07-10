// components/VaultUnlockDialog.jsx
"use client";

import { useState } from "react";
import { X, Vault } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function VaultUnlockDialog({
  isOpen,
  onClose,
  onUnlock,
  loading,
  error,
}) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = schema.safeParse({ password });
    if (validation.success) {
      onUnlock(password);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-700">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              🔐 Unlock Your Vault
            </h2>
            <button
              type="button"
              className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
              onClick={onClose}
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">
            Enter your master password to access your vault.
          </p>

          <input
            type="password"
            className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring focus:ring-blue-500"
            placeholder="Master Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoFocus
            disabled={loading}
          />

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Unlocking..." : "Unlock Vault"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
