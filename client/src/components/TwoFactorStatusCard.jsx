// components/TwoFactorStatusCard.jsx
import { ShieldCheck, ShieldAlert } from "lucide-react";
import Enable2FAButton from "./Enable2FAButton";

export default function TwoFactorStatusCard({ enabled }) {
  return (
    <div
      className={`rounded-xl p-4 shadow-sm max-w-md backdrop-blur-sm border ${
        enabled
          ? "bg-emerald-500/10 border-emerald-500/20"
          : "bg-orange-500/10 border-orange-500/20"
      }`}
    >
      <div className="flex items-start">
        {enabled ? (
          <ShieldCheck className="h-6 w-6 text-emerald-400 mt-0.5 flex-shrink-0" />
        ) : (
          <ShieldAlert className="h-6 w-6 text-orange-400 mt-0.5 flex-shrink-0" />
        )}
        <div className="ml-3">
          <h3
            className={`font-medium ${
              enabled ? "text-emerald-400" : "text-orange-400"
            }`}
          >
            {enabled ? "Security Enabled" : "Security Recommendation"}
          </h3>
          <p
            className={`text-sm mt-1 ${
              enabled ? "text-emerald-400/80" : "text-orange-400/80"
            }`}
          >
            {enabled
              ? "Two-factor authentication is active on your account"
              : "Enable two-factor authentication to secure your vault"}
          </p>
        </div>
      </div>

      {!enabled && (
        <div className="mt-4">
          <Enable2FAButton />
        </div>
      )}
    </div>
  );
}
