import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
} from "lucide-react";

const SecurityPostureCard = ({ user, heirs, vaultStatus }) => {
  // Derive signals
  const twoFactorEnabled = user?.twoFactorEnabled;
  const hasVerifiedHeir = heirs?.some((h) => h.linkStatus === "LINKED");
  const vaultActive = vaultStatus === "ACTIVE";

  // Determine Posture Level
  let posture = "STRONG";
  let color = "emerald";
  let Icon = ShieldCheck;

  if (!twoFactorEnabled || !hasVerifiedHeir) {
    posture = "ATTENTION";
    color = "amber";
    Icon = AlertTriangle;
  }

  // If critical conditions met (e.g. vault in grace period or claimed - though claimed might be different)
  if (vaultStatus === "GRACE" || vaultStatus === "CLAIMED") {
    posture = "CRITICAL";
    color = "red";
    Icon = XCircle;
  }

  const signals = [
    {
      label: "Two-Factor Authentication",
      status: twoFactorEnabled,
      text: twoFactorEnabled ? "Enabled" : "Disabled",
    },
    {
      label: "Heir Designation",
      status: hasVerifiedHeir,
      text: hasVerifiedHeir ? "Verified Heir Linked" : "No Verified Heir",
    },
    {
      label: "Vault Status",
      status: vaultActive,
      text: vaultStatus || "Unknown",
    },
  ];

  const colorClasses = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    red: "bg-red-500/10 border-red-500/20 text-red-400",
  };

  const iconColors = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
  };

  return (
    <div
      className={`border rounded-xl p-4 backdrop-blur-sm ${colorClasses[color]}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`h-6 w-6 ${iconColors[color]}`} />
        <div>
          <h3 className="font-bold text-lg tracking-tight">
            SECURITY POSTURE: {posture}
          </h3>
        </div>
      </div>

      <div className="space-y-2">
        {signals.map((signal, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            {signal.status ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle
                className={`h-4 w-4 ${
                  posture === "CRITICAL" ? "text-red-400" : "text-amber-400"
                }`}
              />
            )}
            <span className="text-slate-300">
              {signal.label}:{" "}
              <span className="font-medium text-slate-200">{signal.text}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityPostureCard;
