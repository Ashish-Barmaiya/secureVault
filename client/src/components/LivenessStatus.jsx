"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/utils/authFetch";
import { Clock, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";

export default function LivenessStatus() {
  const [liveness, setLiveness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLivenessStatus();
  }, []);

  const fetchLivenessStatus = async () => {
    try {
      const res = await authFetch("/api/dashboard/vault/liveness-status");
      if (res.ok) {
        const data = await res.json();
        setLiveness(data.liveness);
      }
    } catch (error) {
      console.error("Failed to fetch liveness status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-zinc-800/50 rounded-xl p-4 h-32"></div>
    );
  }

  if (!liveness) return null;

  const getStatusColor = (state) => {
    switch (state) {
      case "ACTIVE":
        return "emerald";
      case "GRACE":
        return "amber";
      case "INHERITABLE":
        return "red";
      default:
        return "zinc";
    }
  };

  const getStatusIcon = (state) => {
    switch (state) {
      case "ACTIVE":
        return <CheckCircle className="w-5 h-5" />;
      case "GRACE":
        return <AlertTriangle className="w-5 h-5" />;
      case "INHERITABLE":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const color = getStatusColor(liveness.state);
  const missedIntervals = liveness.missedIntervals || 0;

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <div
        className={`bg-gradient-to-br from-${color}-900/20 to-${color}-800/10 border border-${color}-500/30 rounded-xl p-6 backdrop-blur-sm`}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              Vault Liveness Status
            </h3>
            <p className="text-sm text-zinc-400">
              Automatic inheritance monitoring
            </p>
          </div>
          <div className={`text-${color}-400`}>
            {getStatusIcon(liveness.state)}
          </div>
        </div>

        <div className="space-y-3">
          {/* Current State */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Current State:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold bg-${color}-500/20 text-${color}-300 border border-${color}-500/30`}
            >
              {liveness.state}
            </span>
          </div>

          {/* Last Unlock */}
          {liveness.lastSuccessfulUnlockAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Last Unlock:</span>
              <span className="text-sm text-white font-medium">
                {new Date(liveness.lastSuccessfulUnlockAt).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
              </span>
            </div>
          )}

          {/* Next Check-in */}
          {liveness.nextCheckDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Next Check-in:</span>
              <span className="text-sm text-white font-medium">
                {new Date(liveness.nextCheckDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}

          {/* Inactivity Period */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Check-in Period:</span>
            <span className="text-sm text-white font-medium">
              Every {liveness.inactivityPeriod} days
            </span>
          </div>
        </div>
      </div>

      {/* Missed Intervals Warning */}
      {missedIntervals >= 1 && liveness.state === "ACTIVE" && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-300 mb-1">
                Liveness Check Missed
              </h4>
              <p className="text-xs text-amber-200/80 mb-3">
                You've missed {missedIntervals} check-in
                {missedIntervals > 1 ? "s" : ""}. After 3 missed intervals, your
                vault enters Grace Period.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 bg-amber-500 text-amber-950 rounded-lg text-xs font-semibold hover:bg-amber-400 transition"
              >
                Unlock Vault to Submit Proof
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grace Period Alert */}
      {liveness.state === "GRACE" && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-300 mb-1">
                🚨 Grace Period Active
              </h4>
              <p className="text-xs text-red-200/80 mb-2">
                Your vault has been inactive for an extended period. You have 30
                days to unlock your vault or your designated heirs will be able
                to claim access.
              </p>
              {liveness.graceStartedAt && (
                <p className="text-xs text-red-300 mb-3">
                  Grace started:{" "}
                  {new Date(liveness.graceStartedAt).toLocaleDateString(
                    "en-US"
                  )}
                </p>
              )}
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-400 transition"
              >
                Unlock Vault Now to Cancel Inheritance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inheritable State */}
      {liveness.state === "INHERITABLE" && (
        <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-300 mb-1">
                Vault Inheritable
              </h4>
              <p className="text-xs text-red-200/80">
                Your designated heirs can now claim access to your vault. Unlock
                your vault to regain full control.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box - How it Works */}
      <details className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4 backdrop-blur-sm">
        <summary className="text-sm font-semibold text-white cursor-pointer hover:text-blue-400 transition">
          How does liveness monitoring work?
        </summary>
        <div className="mt-3 text-xs text-zinc-400 space-y-2">
          <p>
            Every time you unlock your vault, an encrypted liveness proof is
            automatically submitted to confirm you're still active.
          </p>
          <p>
            If you don't unlock your vault within your check-in period (
            {liveness.inactivityPeriod} days), the system counts it as a missed
            interval.
          </p>
          <p className="text-amber-300">
            After 3 missed intervals ({liveness.inactivityPeriod * 3} days),
            your vault enters a 30-day Grace Period where you'll receive urgent
            notifications.
          </p>
          <p className="text-red-300">
            If the Grace Period expires without activity, your vault becomes
            inheritable by your designated heirs.
          </p>
        </div>
      </details>
    </div>
  );
}
