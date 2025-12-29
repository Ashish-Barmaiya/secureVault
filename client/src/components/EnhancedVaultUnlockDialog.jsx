"use client";

import { useState, useEffect } from "react";
import {
  X,
  Lock,
  Unlock,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { z } from "zod";

const schema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const MAX_ATTEMPTS = 5;
const COOLDOWN_MINUTES = 15;

export default function EnhancedVaultUnlockDialog({
  isOpen,
  onClose,
  onUnlock,
  loading,
  error,
  failureCount = 0,
  vuaStatus = null, // "success", "failed", null
}) {
  const [password, setPassword] = useState("");
  const [currentStep, setCurrentStep] = useState("");
  const [showVuaNotification, setShowVuaNotification] = useState(false);

  const attemptsLeft = MAX_ATTEMPTS - failureCount;
  const isLockedOut = failureCount >= MAX_ATTEMPTS;

  useEffect(() => {
    if (vuaStatus) {
      setShowVuaNotification(true);
      const timer = setTimeout(() => setShowVuaNotification(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [vuaStatus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = schema.safeParse({ password });
    if (validation.success && !isLockedOut) {
      onUnlock(password, setCurrentStep);
    }
  };

  const handleClose = () => {
    setPassword("");
    setCurrentStep("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!loading ? handleClose : undefined}
      />
      <div className="absolute top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 shadow-2xl border border-zinc-700">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Lock className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Unlock Vault</h2>
            </div>
            <button
              type="button"
              className="text-zinc-500 hover:text-white transition disabled:opacity-50"
              onClick={handleClose}
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Security Notice */}
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-200">
                Unlocking your vault automatically submits an encrypted liveness
                proof to maintain inheritance monitoring.
              </p>
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Master Password
            </label>
            <input
              type="password"
              className={`w-full px-4 py-3 rounded-lg border ${
                error
                  ? "border-red-500 bg-red-900/10"
                  : "border-zinc-700 bg-zinc-800"
              } text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder="Enter your master password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoFocus
              disabled={loading || isLockedOut}
            />
          </div>

          {/* Attempts Counter */}
          {failureCount > 0 && !isLockedOut && (
            <div className="mb-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <p className="text-xs text-amber-200">
                  <span className="font-semibold">{attemptsLeft}</span> attempt
                  {attemptsLeft !== 1 ? "s" : ""} remaining before{" "}
                  {COOLDOWN_MINUTES}-minute lockout
                </p>
              </div>
            </div>
          )}

          {/* Lockout Warning */}
          {isLockedOut && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-300 mb-1">
                    Account Locked
                  </p>
                  <p className="text-xs text-red-200">
                    Too many failed attempts. Please wait {COOLDOWN_MINUTES}{" "}
                    minutes before trying again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !isLockedOut && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">❌ {error}</p>
            </div>
          )}

          {/* Progress Steps */}
          {loading && currentStep && (
            <div className="mb-4 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-white mb-1">
                    Processing...
                  </p>
                  <p className="text-xs text-zinc-400">{currentStep}</p>
                </div>
              </div>
            </div>
          )}

          {/* VUA Success Notification */}
          {showVuaNotification && vuaStatus === "success" && (
            <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg animate-fade-in">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-emerald-300 mb-1">
                    Liveness Proof Submitted
                  </p>
                  <p className="text-xs text-emerald-200">
                    Your vault activity has been recorded. Inheritance
                    monitoring updated.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VUA Failure Notification */}
          {showVuaNotification && vuaStatus === "failed" && (
            <div className="mb-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg animate-fade-in">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-300 mb-1">
                    Liveness Proof Failed (Advisory)
                  </p>
                  <p className="text-xs text-amber-200 mb-2">
                    Your vault is fully accessible, but the liveness proof
                    couldn't be submitted. To retry, lock and unlock your vault
                    again.
                  </p>
                  <p className="text-xs text-amber-300/70 italic">
                    This does not affect your ability to use your vault.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-5 py-2.5 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isLockedOut || !password}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Unlocking...
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  Unlock Vault
                </>
              )}
            </button>
          </div>

          {/* Security Info */}
          <div className="mt-4 pt-4 border-t border-zinc-700">
            <p className="text-xs text-zinc-500 text-center">
              🔒 Your password never leaves this device. All encryption happens
              client-side.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
