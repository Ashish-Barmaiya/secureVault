import React, { useState } from "react";
import { Lock } from "lucide-react";

const VaultAccessPanel = ({ onUnlock, statusMessage }) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onUnlock(password);
    } catch (error) {
      console.error("Unlock failed", error);
    } finally {
      setIsLoading(false);
      setPassword("");
    }
  };

  return (
    <div className="mt-8 border-t border-slate-800 pt-8">
      <div className="max-w-2xl mx-auto bg-slate-900/50 border border-slate-800 p-8 rounded-2xl text-center">
        <div className="inline-flex p-3 bg-slate-800 rounded-full mb-4">
          <Lock className="h-6 w-6 text-slate-400" />
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">
          Restricted Vault Access
        </h2>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Unlocking the vault decrypts sensitive data on your device. This
          action is logged and visible to heirs.
        </p>

        <form
          onSubmit={handleUnlock}
          className="flex flex-col items-center gap-4"
        >
          <input
            type="password"
            placeholder="Enter Master Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full max-w-sm bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            required
          />

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full max-w-sm bg-red-700 hover:bg-red-800 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
          >
            {isLoading ? "Processing..." : "Unlock Vault"}
          </button>
        </form>

        {isLoading && statusMessage && (
          <p className="text-sm text-blue-400 mt-2 animate-pulse">
            {statusMessage}
          </p>
        )}

        <p className="text-xs text-slate-500 mt-4">
          Requires master password • Action is irreversible
        </p>
      </div>
    </div>
  );
};

export default VaultAccessPanel;
